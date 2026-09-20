/** EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. */
// Appearance motion for the OVERLAY family (Popover, Tooltip, DropdownMenu (+ Select / Multiselect), Modal, Drawer, Overlay);
// see src/lib/ext/README.md, "Оверлеи".
//
// These components keep their popup element in the DOM (Popover, Tooltip, DropdownMenu) or keep it until their own state
// machine unmounts it (Modal, Drawer, Overlay), so a `{#if}`-bound `transition:` directive cannot drive them without changing
// the original markup. This hook is the Svelte-native alternative for that case: a `Tween` or a `Spring` (`svelte/motion`, see below) of a progress value
// (0 = hidden pose, 1 = shown pose) that is written to the element as INLINE `opacity` / `scale` / `translate` /
// `transform-origin` (the individual CSS transform properties, so Popper's and the components' own `transform` stay untouched).
// Durations and easings are the theme tokens (`--atmr-motion-*`), like the `rt*` presets in transitions.ts.
//
//   const m = useMotion(() => motion, 'popover');
//   const show = useShowMotion({ m, node: () => el, scale: 0.95, origin: () => originFromPlacement(pp.placement) });
//   show.enter();   // -> starts the motion, returns the ms it takes (0 = motion is off / reduced: nothing animates)
//   show.exit();    // -> `show.exiting` is true until the exit has finished: keep the element shown while it is
//
// With motion off (`m.enabled` false: the default, or prefers-reduced-motion) `enter()` / `exit()` do nothing at all, so the
// component runs its ORIGINAL path. When an animation finishes every inline value it wrote is restored (and a `style` attribute
// that did not exist before is removed again), so the settled DOM equals the original's.
//
// The progress is driven by a `Driver` (driver.svelte.ts): a Svelte `Tween` (duration + easing, the default) or, when the motion type of the component / the
// provider is 'spring', a Svelte `Spring` (stiffness + damping). With a spring the pose may overshoot a little and settle: `scale` and `translate` follow it
// (a lively pop for popovers and modals, a critically damped slide for drawers), `opacity` is clamped to 0..1. `enter()` / `exit()` still return the ms until it
// has settled (for a spring: the estimate `springSettleMs`).
import { untrack } from 'svelte';
import { Driver, SPRING, springSettleMs, type DriveLeg } from './driver.svelte.js';
import { motionDuration, motionEasing, type DurationToken, type EasingFn, type EasingToken, type MotionHandle, type MotionProp } from './motion.svelte.js';

export interface ShowLeg {
	/** ms or a duration token */
	duration?: number | DurationToken;
	/** easing function or an easing token */
	easing?: EasingFn | EasingToken;
}

export interface ShowMotionOptions {
	/** The component's `useMotion()` handle: everything below only runs while `m.enabled`. */
	m: MotionHandle;
	/** The element that appears / disappears (read lazily: a `bind:this` variable). */
	node: () => HTMLElement | null | undefined;
	/** The component's own `motion` prop: an options object may set `duration` / `easing` / `delay` for both directions. */
	prop?: () => MotionProp;
	/** Fade the opacity (default true). The opacity at rest (e.g. an Overlay's 50 %) is read from the computed style. */
	opacity?: boolean;
	/** Scale from this value (e.g. 0.95) to 1 while showing. */
	scale?: number;
	/**
	 * Where the scale grows from, as CSS keywords (`'left top'`, `'center bottom'`, `'center'`), e.g. `originFromPlacement(popper placement)`.
	 * Read on every frame. The element's own `transform` (Popper's `translate(x, y)`, Modal's `translate(-50%, ...)`) is compensated:
	 * the individual `scale` property is applied OUTSIDE `transform`, so a plain `transform-origin: left top` would slide the popup.
	 */
	origin?: () => string | null | undefined;
	/** Offset of the hidden pose for `translate` (e.g. `{ x: 100, unit: '%' }` = starts one width to the right). */
	offset?: () => { x?: number; y?: number; unit?: 'px' | '%' } | null | undefined;
	/** Set an inline `transition: none` while animating (the element has its own CSS transitions that would smooth the motion). Default true. */
	suppressCssTransitions?: boolean;
	/** Called (in a microtask, after the DOM update that hides the element) when an EXIT has finished, e.g. to let Popper recompute a hidden popup like the original does at close. */
	onExited?: () => void;
	/** Defaults of the entrance / exit legs (default: 's' + 'productive-entrance' in, 's' + 'productive-exit' out). */
	in?: ShowLeg;
	out?: ShowLeg;
	/**
	 * Spring defaults of the entrance / exit legs, used when the motion type is 'spring' and the option is not given by the user
	 * (default: `SPRING.lively` in - a small overshoot -, `SPRING.smooth` out; use `SPRING.smooth` for big things that must not overshoot, like a drawer).
	 */
	spring?: { in?: ShowSpring; out?: ShowSpring };
}

export interface ShowSpring {
	stiffness?: number;
	damping?: number;
	precision?: number;
}

export interface ShowMotion {
	/**
	 * Start the entrance. Returns the ms until it has settled (delay + duration); 0 when motion is off (then nothing was done).
	 * `restart: true` begins from the hidden pose even if a previous entrance is still running (new content arriving while the old one is
	 * still fading in); by default a running motion continues from where it is.
	 */
	enter(opts?: { delay?: number; restart?: boolean }): number;
	/** Start the exit. Returns the ms until it has settled; 0 when motion is off. `exiting` is true until then. */
	exit(opts?: { delay?: number; restart?: boolean }): number;
	/** Reactive: an exit animation is running - keep the element shown (and its content mounted) while this is true. */
	readonly exiting: boolean;
	/** Duration (ms, without delay) the entrance / exit would take right now (0 when motion is off). */
	durationIn(): number;
	durationOut(): number;
}

const DEFAULT_IN: Required<ShowLeg> = { duration: 's', easing: 'productive-entrance' };
const DEFAULT_OUT: Required<ShowLeg> = { duration: 's', easing: 'productive-exit' };
const PROPS = ['opacity', 'scale', 'translate', 'transform-origin', 'transition'] as const;
const fmt = (n: number) => String(Math.round(n * 10000) / 10000);
/** `<body>` for reading the theme tokens before the popup exists; `null` on the server (SSR: the tokens' fallback values are used) */
const bodyEl = (): HTMLElement | null => (typeof document === 'undefined' ? null : document.body);

/**
 * `transform-origin` for a Popper placement (`'bottom-start'`, `'top'`, ...): the popup grows out of the side facing its trigger,
 * from the corner / edge the placement is aligned to. `null` (not positioned yet) = centre.
 */
export function originFromPlacement(placement: string | null | undefined): string {
	const [side, align] = String(placement ?? '').split('-');
	const start = align === 'start';
	const end = align === 'end';
	switch (side) {
		case 'bottom':
			return `${start ? 'left' : end ? 'right' : 'center'} top`;
		case 'top':
			return `${start ? 'left' : end ? 'right' : 'center'} bottom`;
		case 'right':
			return `left ${start ? 'top' : end ? 'bottom' : 'center'}`;
		case 'left':
			return `right ${start ? 'top' : end ? 'bottom' : 'center'}`;
		default:
			return 'center';
	}
}

/** Call at component init (it creates an effect). */
export function useShowMotion(o: ShowMotionOptions): ShowMotion {
	const d = new Driver(0);
	let dir: 'idle' | 'in' | 'out' = 'idle';
	let gen = 0;
	let exiting = $state(false);
	let target: HTMLElement | null = null;
	let saved: Record<string, string> = {};
	const touched = new Set<string>();
	let hadStyleAttr = false;
	let base = 1;

	/** the leg to run: what to hand to the driver and how long it takes (`ms` = delay + duration, or delay + the estimated settle time of a spring) */
	function leg(direction: 'in' | 'out', el: HTMLElement | null, delay?: number): { drive: DriveLeg; ms: number; settle: number } {
		const cfg = o.m.config;
		const wait = Math.max(0, delay ?? (cfg?.set.delay ? cfg.delay : 0));
		if (cfg?.type === 'spring') {
			const sp = (direction === 'in' ? o.spring?.in : o.spring?.out) ?? (direction === 'in' ? SPRING.lively : SPRING.smooth);
			const stiffness = cfg.set.stiffness ? cfg.stiffness : (sp.stiffness ?? SPRING.smooth.stiffness);
			const damping = cfg.set.damping ? cfg.damping : (sp.damping ?? SPRING.smooth.damping);
			const precision = cfg.set.precision ? cfg.precision! : ((sp as ShowSpring).precision ?? 0.002);
			const settle = springSettleMs(stiffness, damping, precision);
			return { drive: { type: 'spring', stiffness, damping, precision, delay: wait }, ms: wait + settle, settle };
		}
		const dflt = direction === 'in' ? { ...DEFAULT_IN, ...o.in } : { ...DEFAULT_OUT, ...o.out };
		const duration = cfg?.set.duration ? cfg.duration : motionDuration(dflt.duration, el);
		const easing = cfg?.set.easing ? cfg.easing : motionEasing(dflt.easing, el);
		return { drive: { type: 'tween', duration, easing, delay: wait }, ms: wait + duration, settle: duration };
	}

	/** remember what the element had inline and how opaque it is at rest (only when starting from rest) */
	function begin(el: HTMLElement, from: number, restart?: boolean) {
		if (dir === 'idle' || target !== el) {
			target = el;
			hadStyleAttr = el.hasAttribute('style');
			saved = {};
			touched.clear();
			for (const p of PROPS) saved[p] = el.style.getPropertyValue(p);
			const b = parseFloat(getComputedStyle(el).opacity);
			base = b > 0.001 ? b : 1;
			d.jump(from);
		} else {
			// freeze: aborts a running / waiting task, then continue from where it is (or from the pose the leg starts from)
			d.jump(restart ? from : d.value);
		}
	}

	/** `transform-origin` (px) that keeps the anchor point (`'left top'` ...) of the element where its own `transform` puts it */
	function originPx(el: HTMLElement, keywords: string): string {
		const k = keywords.split(/\s+/);
		const frac = (v: string | undefined, lo: string, hi: string) => (v === lo ? 0 : v === hi ? 1 : 0.5);
		const fx = frac(k[0], 'left', 'right');
		const fy = k.length > 1 ? frac(k[1], 'top', 'bottom') : frac(k[0], 'top', 'bottom');
		let tx = 0;
		let ty = 0;
		const t = getComputedStyle(el).transform;
		if (t && t !== 'none') {
			try {
				const m = new DOMMatrixReadOnly(t);
				tx = m.m41;
				ty = m.m42;
			} catch {
				// not a matrix (an element without a box): no compensation
			}
		}
		return `${fmt(fx * el.offsetWidth + tx)}px ${fmt(fy * el.offsetHeight + ty)}px`;
	}

	function apply(el: HTMLElement, p: number, origin: string | null | undefined) {
		const set = (prop: string, value: string) => {
			touched.add(prop);
			el.style.setProperty(prop, value);
		};
		if (o.opacity !== false) set('opacity', fmt(base * Math.min(1, Math.max(0, p)))); // (a spring may overshoot)
		if (o.scale !== undefined) {
			set('scale', fmt(o.scale + (1 - o.scale) * p));
			if (origin) set('transform-origin', originPx(el, origin));
		}
		const off = o.offset?.();
		if (off) {
			const u = off.unit ?? 'px';
			set('translate', `${fmt((off.x ?? 0) * (1 - p))}${u} ${fmt((off.y ?? 0) * (1 - p))}${u}`);
		}
		if (o.suppressCssTransitions !== false) set('transition', 'none');
	}

	function restore() {
		const el = target;
		target = null;
		if (!el) return;
		for (const p of touched) {
			if (saved[p]) el.style.setProperty(p, saved[p]);
			else el.style.removeProperty(p);
		}
		touched.clear();
		if (!hadStyleAttr && !el.getAttribute('style')) el.removeAttribute('style');
	}

	function finish(g: number) {
		if (g !== gen) return;
		const wasOut = dir === 'out';
		dir = 'idle';
		restore();
		exiting = false;
		if (wasOut && o.onExited) queueMicrotask(o.onExited);
	}

	function run(direction: 'in' | 'out', delay: number | undefined, restart?: boolean): number {
		const el = o.node();
		if (!el || !o.m.enabled) return 0;
		begin(el, direction === 'in' ? 0 : 1, restart);
		const l = leg(direction, el, delay);
		dir = direction;
		exiting = direction === 'out';
		const g = ++gen;
		apply(el, d.value, o.origin?.());
		void d.go(direction === 'in' ? 1 : 0, l.drive).then(() => finish(g));
		return l.ms;
	}

	// write every frame of the motion (and every change of the origin) to the element
	$effect(() => {
		const p = d.value;
		const el = o.node();
		const origin = o.origin?.();
		void o.offset?.();
		untrack(() => {
			if (dir !== 'idle' && el && el === target) apply(el, p, origin);
		});
	});
	$effect(() => () => {
		gen++; // the component is gone: a running motion must not touch anything any more
		restore();
	});

	return {
		enter: (opts) => run('in', opts?.delay, opts?.restart),
		exit: (opts) => run('out', opts?.delay, opts?.restart),
		get exiting() {
			return exiting;
		},
		// (the node may not exist yet: the theme tokens are then read from <body>)
		durationIn: () => (o.m.enabled ? leg('in', o.node() ?? bodyEl(), 0).settle : 0),
		durationOut: () => (o.m.enabled ? leg('out', o.node() ?? bodyEl(), 0).settle : 0)
	};
}
