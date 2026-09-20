// Svelte port of `react-transition-group@4.4.5` Transition + CSSTransition (+ the key merging of TransitionGroup), as used by the
// Notifications (ToastNotificationsProvider -> TransitionGroup/CSSTransition, InlineNotification/CustomInlineNotification -> CSSTransition).
//
// Same state machine and class sequence as React (`<cn>-enter`, `-enter-active`, `-enter-done`, `-exit`, `-exit-active`, `-exit-done`,
// `appear` variants) applied directly to the DOM node with `classList` (exactly what CSSTransition does with `nodeRef`), same timers.
//
// USAGE (in a component's <script>; must run during component init because it registers effects)
//   let el = $state<HTMLElement | null>(null);                    // <div bind:this={el}> inside the {#if}
//   const t = new CSSTransition(() => isOpen, () => ({ classNames: 'x', timeout: 300, mountOnEnter: true, unmountOnExit: true }), () => el);
//   {#if t.status !== 'unmounted'} <div bind:this={el}>...</div> {/if}
import { tick, untrack } from 'svelte';

export type TransitionStatus = 'unmounted' | 'exited' | 'entering' | 'entered' | 'exiting';
type Phase = 'base' | 'active' | 'done';
type TransitionType = 'appear' | 'enter' | 'exit';

export interface ClassNamesObject {
	appear?: string;
	appearActive?: string;
	appearDone?: string;
	enter?: string;
	enterActive?: string;
	enterDone?: string;
	exit?: string;
	exitActive?: string;
	exitDone?: string;
}

type Hook = (node: HTMLElement | null | undefined, isAppearing?: boolean) => void;

export interface CSSTransitionConfig {
	mountOnEnter?: boolean;
	unmountOnExit?: boolean;
	appear?: boolean;
	enter?: boolean;
	exit?: boolean;
	timeout?: number | { appear?: number; enter?: number; exit?: number };
	classNames?: string | ClassNamesObject;
	/** `addEndListener(done)` (nodeRef flavour of the React prop) */
	addEndListener?: (done: () => void) => void;
	onEnter?: Hook;
	onEntering?: Hook;
	onEntered?: Hook;
	onExit?: Hook;
	onExiting?: Hook;
	onExited?: Hook;
	[key: string]: unknown;
}

/** Value of React's `TransitionGroupContext` (`{ isMounting }`). */
export interface TransitionGroupContext {
	isMounting: boolean;
}

interface NextCallback {
	(): void;
	cancel: () => void;
}

const forceReflow = (node: HTMLElement) => node.scrollTop;

const addClasses = (node: HTMLElement | null | undefined, classes: string | undefined) => {
	if (node && classes) classes.split(' ').forEach((c) => c && node.classList.add(c));
};
const removeClasses = (node: HTMLElement | null | undefined, classes: string | undefined) => {
	if (node && classes) classes.split(' ').forEach((c) => c && node.classList.remove(c));
};

const getTimeouts = (timeout: CSSTransitionConfig['timeout']) => {
	let exit: number | undefined, enter: number | undefined, appear: number | undefined;
	exit = enter = appear = timeout as number | undefined;
	if (timeout != null && typeof timeout !== 'number') {
		exit = timeout.exit;
		enter = timeout.enter;
		appear = timeout.appear !== undefined ? timeout.appear : enter;
	}
	return { exit, enter, appear };
};

export class CSSTransition {
	status = $state<TransitionStatus>('exited');

	#getIn: () => boolean;
	#getConfig: () => CSSTransitionConfig;
	#getNode: () => HTMLElement | null | undefined;
	#group: TransitionGroupContext | undefined;
	#appearStatus: TransitionStatus | null = null;
	#nextCallback: NextCallback | null = null;
	#applied: Record<TransitionType, Partial<Record<Phase, string>>> = { appear: {}, enter: {}, exit: {} };
	#mounted = false;
	#destroyed = false;
	#lastIn = false;
	#pendingEnter = false;

	constructor(
		getIn: () => boolean,
		getConfig: () => CSSTransitionConfig,
		getNode: () => HTMLElement | null | undefined,
		group?: TransitionGroupContext
	) {
		this.#getIn = getIn;
		this.#getConfig = getConfig;
		this.#getNode = getNode;
		this.#group = group;

		// Transition constructor: initial status
		const cfg = untrack(getConfig);
		const isIn = untrack(getIn);
		// In the context of a TransitionGroup all enters are really appears
		const appear = group && !group.isMounting ? (cfg.enter ?? true) : (cfg.appear ?? false);
		if (isIn) {
			if (appear) {
				this.status = 'exited';
				this.#appearStatus = 'entering';
			} else {
				this.status = 'entered';
			}
		} else {
			this.status = cfg.unmountOnExit || cfg.mountOnEnter ? 'unmounted' : 'exited';
		}

		// componentDidMount + componentDidUpdate (re-runs whenever `in` changes). `in` may already differ from the value the
		// constructor saw when the effect runs for the first time (e.g. an `isOpen` flipped by a sibling mount effect).
		this.#lastIn = !!isIn;
		$effect(() => {
			const nextIn = !!getIn();
			untrack(() => {
				if (!this.#mounted) {
					this.#mounted = true;
					this.#updateStatus(true, this.#appearStatus);
				}
				if (nextIn !== this.#lastIn) {
					this.#lastIn = nextIn;
					this.#didUpdate();
				}
			});
		});
		// componentDidUpdate of the first render of a child that was UNMOUNTED (getDerivedStateFromProps rendered it as EXITED): React starts
		// the enter synchronously right after that commit - i.e. before any microtask, so e.g. a Popper created by a descendant sees the
		// ENTERING classes when it first measures. Here the same happens in the flush that rendered the node (as soon as it is bound).
		$effect(() => {
			const node = getNode();
			const status = this.status;
			untrack(() => {
				if (this.#pendingEnter && status === 'exited' && node) {
					this.#pendingEnter = false;
					this.#continueDidUpdate();
				}
			});
		});
		// componentWillUnmount
		$effect(() => () => {
			this.#destroyed = true;
			this.#cancelNextCallback();
		});
	}

	#didUpdate() {
		this.#pendingEnter = false;
		if (this.#getIn() && this.status === 'unmounted') {
			// getDerivedStateFromProps: render the child (EXITED) before entering; the enter continues once the node exists
			this.status = 'exited';
			this.#pendingEnter = true;
			// fallback for children without a bound node (never the case for the Notifications / Drawer): continue after the render
			void tick().then(() => {
				if (this.#pendingEnter && !this.#destroyed) {
					this.#pendingEnter = false;
					this.#continueDidUpdate();
				}
			});
			return;
		}
		this.#continueDidUpdate();
	}

	#continueDidUpdate() {
		const status = this.status;
		let nextStatus: TransitionStatus | null = null;
		if (this.#getIn()) {
			if (status !== 'entering' && status !== 'entered') nextStatus = 'entering';
		} else if (status === 'entering' || status === 'entered') {
			nextStatus = 'exiting';
		}
		this.#updateStatus(false, nextStatus);
	}

	#updateStatus(mounting: boolean, nextStatus: TransitionStatus | null) {
		const cfg = this.#getConfig();
		if (nextStatus !== null) {
			this.#cancelNextCallback();
			if (nextStatus === 'entering') {
				if (cfg.unmountOnExit || cfg.mountOnEnter) {
					const node = this.#getNode();
					if (node) forceReflow(node);
				}
				this.#performEnter(mounting);
			} else {
				this.#performExit();
			}
		} else if (cfg.unmountOnExit && this.status === 'exited') {
			this.status = 'unmounted';
		}
	}

	#performEnter(mounting: boolean) {
		const cfg = this.#getConfig();
		const enter = cfg.enter ?? true;
		const appearing = this.#group ? this.#group.isMounting : mounting;
		const timeouts = getTimeouts(cfg.timeout);
		const enterTimeout = appearing ? timeouts.appear : timeouts.enter;
		// no enter animation skip right to ENTERED (if we are mounting and running this it means appear _must_ be set)
		if (!mounting && !enter) {
			this.#safeSetState('entered', () => this.#onEntered(appearing));
			return;
		}
		this.#onEnter(appearing);
		this.#safeSetState('entering', () => {
			this.#onEntering(appearing);
			this.#onTransitionEnd(enterTimeout, () => {
				this.#safeSetState('entered', () => this.#onEntered(appearing));
			});
		});
	}

	#performExit() {
		const cfg = this.#getConfig();
		const exit = cfg.exit ?? true;
		const timeouts = getTimeouts(cfg.timeout);
		// no exit animation skip right to EXITED
		if (!exit) {
			this.#safeSetState('exited', () => this.#onExited());
			return;
		}
		this.#onExit();
		this.#safeSetState('exiting', () => {
			this.#onExiting();
			this.#onTransitionEnd(timeouts.exit, () => {
				this.#safeSetState('exited', () => this.#onExited());
			});
		});
	}

	#cancelNextCallback() {
		if (this.#nextCallback !== null) {
			this.#nextCallback.cancel();
			this.#nextCallback = null;
		}
	}

	#safeSetState(status: TransitionStatus, callback: () => void) {
		const cb = this.#setNextCallback(callback);
		this.status = status;
		cb();
		// componentDidUpdate -> updateStatus(false, null): an EXITED transition with unmountOnExit is unmounted
		if (!this.#destroyed && this.status === 'exited' && this.#getConfig().unmountOnExit) this.status = 'unmounted';
	}

	#setNextCallback(callback: () => void): NextCallback {
		let active = true;
		const wrapper = (() => {
			if (active) {
				active = false;
				this.#nextCallback = null;
				callback();
			}
		}) as NextCallback;
		wrapper.cancel = () => {
			active = false;
		};
		this.#nextCallback = wrapper;
		return wrapper;
	}

	#onTransitionEnd(timeout: number | undefined, handler: () => void) {
		this.#setNextCallback(handler);
		const next = this.#nextCallback!;
		const node = this.#getNode();
		const cfg = this.#getConfig();
		if (!node || (timeout == null && !cfg.addEndListener)) {
			setTimeout(next, 0);
			return;
		}
		cfg.addEndListener?.(next);
		if (timeout != null) setTimeout(next, timeout);
	}

	// ---- CSSTransition part -------------------------------------------------------------------------------------------

	#getClassNames(type: string) {
		const classNames = this.#getConfig().classNames;
		const isString = typeof classNames === 'string';
		const prefix = isString && classNames ? `${classNames}-` : '';
		const obj = isString ? undefined : (classNames as ClassNamesObject | undefined);
		const base = isString ? `${prefix}${type}` : obj?.[type as keyof ClassNamesObject];
		const active = isString ? `${base}-active` : obj?.[`${type}Active` as keyof ClassNamesObject];
		const done = isString ? `${base}-done` : obj?.[`${type}Done` as keyof ClassNamesObject];
		return { base, active, done } as Record<Phase, string | undefined>;
	}

	#addClass(node: HTMLElement | null | undefined, type: TransitionType, phase: Phase) {
		let className = this.#getClassNames(type)[phase];
		const enterDone = this.#getClassNames('enter').done;
		if (type === 'appear' && phase === 'done' && enterDone) className += ` ${enterDone}`;
		// force a repaint, which is necessary in order to transition styles when adding a class name
		if (phase === 'active' && node) forceReflow(node);
		if (className) {
			this.#applied[type][phase] = className;
			addClasses(node, className);
		}
	}

	#removeClasses(node: HTMLElement | null | undefined, type: TransitionType) {
		const { base, active, done } = this.#applied[type];
		this.#applied[type] = {};
		removeClasses(node, base);
		removeClasses(node, active);
		removeClasses(node, done);
	}

	#onEnter(appearing: boolean) {
		const node = this.#getNode();
		this.#removeClasses(node, 'exit');
		this.#addClass(node, appearing ? 'appear' : 'enter', 'base');
		this.#getConfig().onEnter?.(node, appearing);
	}

	#onEntering(appearing: boolean) {
		const node = this.#getNode();
		this.#addClass(node, appearing ? 'appear' : 'enter', 'active');
		this.#getConfig().onEntering?.(node, appearing);
	}

	#onEntered(appearing: boolean) {
		const node = this.#getNode();
		const type = appearing ? 'appear' : 'enter';
		this.#removeClasses(node, type);
		this.#addClass(node, type, 'done');
		this.#getConfig().onEntered?.(node, appearing);
	}

	#onExit() {
		const node = this.#getNode();
		this.#removeClasses(node, 'appear');
		this.#removeClasses(node, 'enter');
		this.#addClass(node, 'exit', 'base');
		this.#getConfig().onExit?.(node);
	}

	#onExiting() {
		const node = this.#getNode();
		this.#addClass(node, 'exit', 'active');
		this.#getConfig().onExiting?.(node);
	}

	#onExited() {
		const node = this.#getNode();
		this.#removeClasses(node, 'exit');
		this.#addClass(node, 'exit', 'done');
		this.#getConfig().onExited?.(node);
	}
}

/**
 * `mergeChildMappings` of TransitionGroup on key lists: keeps the order of `next`, but keeps keys that only exist in `prev`
 * (leaving children) at their previous position relative to their neighbours.
 */
export function mergeChildKeys(prev: string[], next: string[]): string[] {
	const nextSet = new Set(next);
	const nextKeysPending = new Map<string, string[]>();
	let pendingKeys: string[] = [];
	for (const prevKey of prev) {
		if (nextSet.has(prevKey)) {
			if (pendingKeys.length) {
				nextKeysPending.set(prevKey, pendingKeys);
				pendingKeys = [];
			}
		} else {
			pendingKeys.push(prevKey);
		}
	}
	const result: string[] = [];
	for (const nextKey of next) {
		const pending = nextKeysPending.get(nextKey);
		if (pending) result.push(...pending);
		result.push(nextKey);
	}
	result.push(...pendingKeys);
	return result;
}
