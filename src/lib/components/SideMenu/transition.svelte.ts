// Svelte counterpart of react-transition-group `Transition` (v4.4.5) for the two uses in the side menu
// (CollapseContent: `timeout` = 300, ExpandContent: `addEndListener` on the `transitionend` of `height`), always with a `nodeRef`.
//
//   const t = useTransition(() => ({ in: open, timeout: 300, onEnter() {...}, onEntering() {...}, ... }));
//   t.status   // 'exited' | 'entering' | 'entered' | 'exiting'  (reactive)
//
// Same state machine: initial status is `entered` (in) / `exited` (not in) (no `appear`); when `in` changes: `onEnter` -> status
// `entering` -> `onEntering` -> (timeout / end listener) -> `entered` -> `onEntered`, or `onExit` -> `exiting` -> `onExiting` -> ... -> `exited` ->
// `onExited`. The `on*ing` callbacks run after the new status is rendered (React: setState callback), i.e. after `tick()`.
import { onDestroy, tick, untrack } from 'svelte';

export type TransitionStatus = 'exited' | 'entering' | 'entered' | 'exiting';

export interface TransitionOptions {
	in: boolean;
	timeout?: number;
	/** react-transition-group with `nodeRef`: `addEndListener(done)` */
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

	const onTransitionEnd = (timeout: number | undefined, handler: () => void) => {
		const options = getOptions();
		const done = setNextCallback(handler);
		if (timeout == null && !options.addEndListener) {
			setTimeout(done, 0);
			return;
		}
		options.addEndListener?.(done);
		if (timeout != null) setTimeout(done, timeout);
	};

	const performEnter = () => {
		getOptions().onEnter?.();
		safeSetState('entering', () => {
			getOptions().onEntering?.();
			onTransitionEnd(getOptions().timeout, () => {
				safeSetState('entered', () => getOptions().onEntered?.());
			});
		});
	};

	const performExit = () => {
		getOptions().onExit?.();
		safeSetState('exiting', () => {
			getOptions().onExiting?.();
			onTransitionEnd(getOptions().timeout, () => {
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
