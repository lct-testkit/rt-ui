// Svelte counterpart of react-transition-group `Transition` (v4.4.5) for the one use in AccordionDetails
// (`in`, `timeout` = 300, `nodeRef`, `onEnter` / `onEntering` / `onExit` / `onExiting`). Same state machine as SideMenu/transition.svelte.ts.
//
//   const t = useTransition(() => ({ in: open, timeout: 300, onEnter() {...}, onEntering() {...}, ... }));
//   t.status   // 'exited' | 'entering' | 'entered' | 'exiting'  (reactive)
//
// Initial status is `entered` (in) / `exited` (not in) (no `appear`); when `in` changes: `onEnter` -> status `entering` -> `onEntering` ->
// (timeout) -> `entered` -> `onEntered`, or `onExit` -> `exiting` -> `onExiting` -> (timeout) -> `exited` -> `onExited`.
// The `on*ing` callbacks run after the new status is rendered (React: setState callback), i.e. after `tick()`.
import { onDestroy, tick, untrack } from 'svelte';

export type TransitionStatus = 'exited' | 'entering' | 'entered' | 'exiting';

export interface TransitionOptions {
	in: boolean;
	/** ms until `entered` / `exited` (the original). Omit it when `addEndListener` reports the end. */
	timeout?: number;
	/**
	 * [ext, not in original] react-transition-group's `addEndListener(done)`: the caller reports the end of the transition (the author's Svelte motion
	 * calls `done` when its Tween / Spring has settled). Never set in the original path, which uses `timeout`.
	 */
	addEndListener?: (done: () => void) => void;
	onEnter?: () => void;
	onEntering?: () => void;
	onEntered?: () => void;
	onExit?: () => void;
	onExiting?: () => void;
	onExited?: () => void;
}

export function useTransition(getOptions: () => TransitionOptions): { readonly status: TransitionStatus } {
	const initialIn = untrack(() => getOptions().in);
	let status = $state<TransitionStatus>(initialIn ? 'entered' : 'exited');
	let prevIn = initialIn;
	let cancelPending: (() => void) | null = null;
	let destroyed = false;

	const setNextCallback = (callback: () => void) => {
		let active = true;
		const next = () => {
			if (active) {
				active = false;
				cancelPending = null;
				callback();
			}
		};
		cancelPending = () => {
			active = false;
		};
		return next;
	};
	const cancelNextCallback = () => {
		cancelPending?.();
		cancelPending = null;
	};

	/** `safeSetState(nextState, callback)`: the callback runs once the new status is in the DOM */
	const safeSetState = (next: TransitionStatus, callback: () => void) => {
		const wrapped = setNextCallback(callback);
		status = next;
		void tick().then(() => {
			if (!destroyed) wrapped();
		});
	};

	const onTransitionEnd = (handler: () => void) => {
		const options = getOptions();
		const done = setNextCallback(handler);
		options.addEndListener?.(done);
		if (options.timeout != null) setTimeout(done, options.timeout);
		else if (!options.addEndListener) setTimeout(done, 0);
	};

	const performEnter = () => {
		getOptions().onEnter?.();
		safeSetState('entering', () => {
			getOptions().onEntering?.();
			onTransitionEnd(() => {
				safeSetState('entered', () => getOptions().onEntered?.());
			});
		});
	};

	const performExit = () => {
		getOptions().onExit?.();
		safeSetState('exiting', () => {
			getOptions().onExiting?.();
			onTransitionEnd(() => {
				safeSetState('exited', () => getOptions().onExited?.());
			});
		});
	};

	// componentDidUpdate
	$effect(() => {
		const inProp = getOptions().in;
		untrack(() => {
			if (inProp === prevIn) return;
			prevIn = inProp;
			if (inProp) {
				if (status === 'entering' || status === 'entered') return;
				cancelNextCallback();
				performEnter();
			} else {
				if (status !== 'entering' && status !== 'entered') return;
				cancelNextCallback();
				performExit();
			}
		});
	});

	onDestroy(() => {
		destroyed = true;
		cancelNextCallback();
	});

	return {
		get status() {
			return status;
		}
	};
}
