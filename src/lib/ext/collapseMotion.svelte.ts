/** EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. */
// Height motion of the collapsible wrappers: AccordionDetails, SideMenuCollapseContentTransition and SideMenuExpandContent; see
// src/lib/ext/README.md, "Accordion / SideMenu".
//
// Those wrappers stay in the DOM when they are closed (`hidden` + `height: 0`) and the ORIGINAL animates their `height` with an inline CSS
// `transition` while a react-transition-group-like state machine only counts the time. With the extension on the height is instead driven by
// a Svelte `Tween` or `Spring` (`Driver`), and the content fades and slides with it:
//
//   open  : height 0 -> the natural height of the content ('m' 300 ms, decelerating), the content fades in and moves down 8 px while it opens
//   close : the reverse ('s' 200 ms, standard curve)
//   resize: while open, a change of the content size (an item is added, a nested list opens) glides to the new height instead of jumping
//
// The hook only WRITES inline `height` / `transition` (wrapper) and `opacity` / `translate` (content) while a move runs and puts every inline value
// back afterwards, so once it has settled the DOM is the original's: `height: <n>px` (or `auto` when `settledOpen: 'auto'`) / `0px`.
//
//   const collapse = useCollapseMotion({ m, node: () => wrapper, measure: () => computeOpenHeight(getInner(wrapper)) });
//   // in the state machine:   onEntering() { if (!collapse.open()) originalOpen(); }   onExiting() { if (!collapse.close()) originalClose(); }
//   //                         addEndListener: (done) => collapse.onSettled(done)
import { untrack } from 'svelte';
import { Driver, SPRING, type DriveLeg } from './driver.svelte.js';
import { motionDuration, motionEasing, type MotionHandle, type MotionProp } from './motion.svelte.js';

export interface CollapseMotionOptions {
	/** the component's `useMotion()` handle: nothing below does anything while `m.enabled` is false */
	m: MotionHandle;
	/** the wrapper whose height is animated (a `bind:this` variable) */
	node: () => HTMLElement | null | undefined;
	/** the content that fades (default: the wrapper's first element child) */
	inner?: () => HTMLElement | null | undefined;
	/** the component's own `motion` prop (an object may set duration / easing / delay for both directions) */
	prop?: () => MotionProp;
	/** natural height (px) of the fully open content; called while the wrapper is visible */
	measure: () => number;
	/** the wrapper height once it has settled open: `'px'` (default: the measured height) or `'auto'` (SideMenuExpandContent) */
	settledOpen?: 'px' | 'auto';
	/** how far (px) the content travels while it fades (default 8) */
	shift?: number;
}

export interface CollapseMotion {
	/** starts opening; `false` when motion is off / there is no wrapper (nothing was done: run the original) */
	open(): boolean;
	/** starts closing; `false` when motion is off (nothing was done) */
	close(): boolean;
	/** the content size changed while the wrapper is open: glides to the new height. `false` when motion is off (run the original) */
	resize(): boolean;
	/** calls `done` once the running move has settled (at once when none is running); use it as the `addEndListener` of the state machine */
	onSettled(done: () => void): void;
	/** reactive: a move is running */
	readonly running: boolean;
}

const smooth = (p: number) => {
	const x = Math.min(1, Math.max(0, p));
	return x * x * (3 - 2 * x);
};
const px = (n: number) => `${Math.round(n * 100) / 100}px`;

/** Call at component init (it creates an effect). */
export function useCollapseMotion(o: CollapseMotionOptions): CollapseMotion {
	const d = new Driver(0);
	let target: HTMLElement | null = null;
	let content: HTMLElement | null = null;
	let dir: 'idle' | 'open' | 'close' = 'idle';
	let fade = true;
	let full = 0;
	let gen = 0;
	let running = $state(false);
	let savedWrap: Record<string, string> = {};
	let savedContent: Record<string, string> = {};
	let hadContentStyle = false;
	let measuredOnce = false;
	let waiters: Array<() => void> = [];
	/** the inline `transition` is put back one frame AFTER the height: the last painted height is a fraction of a px off the final one and the CSS transition would drift there */
	let pendingTransition: { el: HTMLElement; value: string; raf: number } | null = null;
	const shift = o.shift ?? 8;

	function leg(direction: 'open' | 'close', el: HTMLElement): DriveLeg {
		const cfg = o.m.config!;
		return {
			type: cfg.type,
			duration: cfg.set.duration ? cfg.duration : motionDuration(direction === 'open' ? 'm' : 's', el),
			easing: cfg.set.easing ? cfg.easing : motionEasing(direction === 'open' ? 'expressive-entrance' : 'productive-standard', el),
			delay: cfg.delay,
			stiffness: cfg.set.stiffness ? cfg.stiffness : SPRING.smooth.stiffness,
			damping: cfg.set.damping ? cfg.damping : SPRING.smooth.damping,
			precision: cfg.set.precision ? cfg.precision : 0.5
		};
	}

	function flushTransition() {
		const p = pendingTransition;
		pendingTransition = null;
		if (!p) return;
		cancelAnimationFrame(p.raf);
		if (p.value) p.el.style.setProperty('transition', p.value);
		else p.el.style.removeProperty('transition');
	}

	function begin(el: HTMLElement) {
		if (dir === 'idle' || target !== el) {
			// (a transition that is still waiting to be put back is the original one, not the `none` written by the previous move)
			const waiting = pendingTransition && pendingTransition.el === el ? pendingTransition.value : undefined;
			if (pendingTransition) {
				cancelAnimationFrame(pendingTransition.raf);
				pendingTransition = null;
			}
			target = el;
			savedWrap = { height: el.style.getPropertyValue('height'), transition: waiting ?? el.style.getPropertyValue('transition') };
			content = o.inner?.() ?? (el.firstElementChild as HTMLElement | null);
			hadContentStyle = !!content?.hasAttribute('style');
			savedContent = content ? { opacity: content.style.getPropertyValue('opacity'), translate: content.style.getPropertyValue('translate') } : {};
		}
		el.style.setProperty('transition', 'none');
	}

	function apply(h: number) {
		const el = target;
		if (!el) return;
		el.style.setProperty('height', px(h));
		if (content && fade) {
			const p = full > 0 ? Math.min(1, h / full) : dir === 'open' ? 1 : 0;
			content.style.setProperty('opacity', String(Math.round(smooth((p - 0.05) / 0.7) * 1000) / 1000));
			content.style.setProperty('translate', `0px ${px(-(1 - p) * shift)}`);
		}
	}

	function restore(open: boolean) {
		const el = target;
		target = null;
		if (!el) return;
		el.style.setProperty('height', open ? (o.settledOpen === 'auto' ? 'auto' : px(o.measure())) : '0px');
		pendingTransition = {
			el,
			value: savedWrap.transition,
			raf: requestAnimationFrame(() => {
				pendingTransition = null;
				if (savedWrap.transition) el.style.setProperty('transition', savedWrap.transition);
				else el.style.removeProperty('transition');
			})
		};
		if (content) {
			for (const p of ['opacity', 'translate'] as const) {
				if (savedContent[p]) content.style.setProperty(p, savedContent[p]);
				else content.style.removeProperty(p);
			}
			if (!hadContentStyle && !content.getAttribute('style')) content.removeAttribute('style');
		}
		content = null;
	}

	function finish(g: number) {
		if (g !== gen) return;
		const wasOpen = dir === 'open';
		dir = 'idle';
		running = false;
		restore(wasOpen);
		const done = waiters;
		waiters = [];
		for (const f of done) f();
	}

	function run(direction: 'open' | 'close', soft = false): boolean {
		const el = o.node();
		if (!el || !o.m.enabled || !o.m.config) return false;
		const now = dir === 'idle' ? el.offsetHeight : d.value; // the height on screen right now
		const continuing = running && dir === direction; // the same move re-aimed (the content changed size): its fade goes on
		begin(el);
		if (!continuing) fade = !soft;
		full = Math.max(direction === 'open' ? o.measure() : Math.max(full, now), 0);
		const to = direction === 'open' ? full : 0;
		dir = direction;
		running = true;
		measuredOnce = true;
		d.jump(now);
		apply(now);
		const g = ++gen;
		void d.go(to, leg(direction, el)).then(() => finish(g));
		return true;
	}

	// write every frame of the driver to the DOM
	$effect(() => {
		const v = d.value;
		untrack(() => {
			if (running) apply(v);
		});
	});
	$effect(() => () => {
		gen++;
		running = false;
		restore(dir === 'open');
		dir = 'idle';
		flushTransition();
	});

	return {
		open: () => run('open'),
		close: () => run('close'),
		resize() {
			const el = o.node();
			if (!el || !o.m.enabled || !o.m.config) return false;
			if (!measuredOnce) {
				// the first measurement of an accordion that is open from the start: no motion, the natural height at once
				measuredOnce = true;
				full = o.measure();
				if (dir === 'idle') el.style.setProperty('height', o.settledOpen === 'auto' ? 'auto' : px(full));
				return true;
			}
			if (dir === 'close') return true;
			const h = o.measure();
			if (dir === 'open') return Math.abs(h - full) < 0.5 ? true : run('open', true); // still opening: continue to the new height
			if (o.settledOpen === 'auto' || Math.abs(el.offsetHeight - h) < 0.5) return true;
			return run('open', true);
		},
		onSettled(done) {
			if (dir === 'idle') done();
			else waiters.push(done);
		},
		get running() {
			return running;
		}
	};
}
