/** EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. */
// Foundation of the author's motion layer (see src/lib/ext/README.md).
//
//   ExtMotionProvider.svelte   global switch ('off' | 'svelte') + per-kind overrides, shared through Svelte context
//   useMotion(prop, kind)      what a component calls: resolves its own `motion` prop against the provider, honours
//                              prefers-reduced-motion, returns reactive `enabled` / `config`
//   useMotionValue(target, config, immediate)
//                              reduced-motion aware wrapper around Svelte's `Tween` / `Spring`: `current` follows `target`
//                              smoothly when motion is on and is EXACTLY `target` when it is off
//   usePressTracker            pointer-down bookkeeping so a slider can bypass smoothing while it is dragged
//
// 'off' (the default) means the ORIGINAL behaviour: nothing in this file changes what an original component renders
// or does unless a `motion` prop / provider switches it on.
//
// This module imports NO CSS: the original components import it (for `useMotion`), so a stylesheet imported here would end up in every consumer's bundle. The motion-only
// styles (`ext.css`) are imported ONLY by `ExtMotionProvider.svelte` and by the extension entry (`ext/index.ts`); the tiny always-safe layout rules of Modal / Drawer
// (`layout-modal.css` / `layout-drawer.css`) by those two components.
import { getContext, setContext, untrack } from 'svelte';
import { Spring, Tween } from 'svelte/motion';
import type { RtTransitionParams } from './transitions.js';

// ─── types ───────────────────────────────────────────────────────────────────────────────────────────────────────

/** Global mode: 'off' = original behaviour (react-transition-group-style classes etc.), 'svelte' = the author's extension. */
export type MotionMode = 'off' | 'svelte';
/** Engine used to follow a changing value: `Tween` (duration + easing) or `Spring` (stiffness + damping). */
export type MotionType = 'tween' | 'spring';
/** Duration tokens `--atmr-motion-duration-*` (100 / 150 / 200 / 300 / 600 / 1200 ms). */
export type DurationToken = '2xs' | 'xs' | 's' | 'm' | 'l' | 'xl';
/** Easing tokens `--atmr-motion-easing-*`. */
export type EasingToken =
	| 'linear'
	| 'productive-standard'
	| 'productive-entrance'
	| 'productive-exit'
	| 'productive-bouncing'
	| 'expressive-standard'
	| 'expressive-entrance'
	| 'expressive-exit'
	| 'expressive-bouncing';
export type EasingFn = (t: number) => number;
/** Which part of the UI a motion setting is for (used by the provider's per-kind overrides). Any string is accepted. */
export type MotionKind =
	| 'slider'
	| 'progress'
	| 'wizard'
	| 'modal'
	| 'drawer'
	| 'popover'
	| 'tooltip'
	| 'dropdown'
	| 'toast'
	| 'accordion'
	| 'tabs'
	| 'calendar'
	| 'sidemenu'
	| 'table-rows'
	| (string & {});

export interface MotionOptions {
	/** Engine (default: the provider's `type`, i.e. 'tween'). */
	type?: MotionType;
	/** Tween: duration in ms or a token name (default 'm' = `--atmr-motion-duration-m`, 300 ms). */
	duration?: number | DurationToken;
	/** Tween: delay in ms. */
	delay?: number;
	/** Tween: easing function or token name (default 'productive-standard'). */
	easing?: EasingFn | EasingToken;
	/** Spring: stiffness, 0..1 (Svelte default 0.15). */
	stiffness?: number;
	/** Spring: damping, 0..1 (Svelte default 0.8). */
	damping?: number;
	/** Spring: settle precision (default 0.01, values are in the component's own units). */
	precision?: number;
}

/**
 * What a component's `motion` prop accepts. `undefined` = inherit the provider (and no provider = off),
 * `false` = off, `true` = on with the provider's default engine, 'tween' / 'spring' = on with that engine,
 * an options object = on with those options.
 */
export type MotionProp = boolean | MotionType | MotionOptions | null | undefined;

/** A `MotionProp` that can also be given per kind to the provider (`'off'` / `'svelte'` are accepted there too). */
export type MotionOverride = MotionProp | MotionMode;

/** `MotionOptions` with every default filled in (tokens are read from the active theme). */
export interface ResolvedMotion {
	type: MotionType;
	/** ms */
	duration: number;
	/** ms */
	delay: number;
	easing: EasingFn;
	stiffness: number;
	damping: number;
	precision?: number;
	/**
	 * Which options were GIVEN (by the component's `motion` prop or the provider's `options`), as opposed to filled in with the defaults above.
	 * A hook that has better defaults for its own kind of motion (a 300 ms slide, a lively spring for a scale ...) uses them unless the option is set.
	 */
	set: { duration: boolean; easing: boolean; delay: boolean; stiffness: boolean; damping: boolean; precision: boolean };
}

// ─── design tokens (durations / easings) ──────────────────────────────────────────────────────────────────────────

const DURATION_FALLBACK: Record<DurationToken, number> = { '2xs': 100, xs: 150, s: 200, m: 300, l: 600, xl: 1200 };
const EASING_FALLBACK: Record<EasingToken, [number, number, number, number]> = {
	linear: [0, 0, 1, 1],
	'productive-standard': [0.4, 0, 0.6, 1],
	'productive-entrance': [0, 0, 0.6, 1],
	'productive-exit': [0.3, 0, 1, 0.9],
	'productive-bouncing': [0.18, 0.89, 0.35, 1.15],
	'expressive-standard': [0.8, 0, 0.2, 1],
	'expressive-entrance': [0, 0, 0.3, 1],
	'expressive-exit': [0.8, 0.15, 1, 1],
	'expressive-bouncing': [0.7, 0.3, 0.5, 1.25]
};

function readToken(name: string, el?: Element | null): string {
	if (typeof document === 'undefined') return '';
	try {
		return getComputedStyle(el ?? document.body).getPropertyValue(name).trim();
	} catch {
		return '';
	}
}

/** CSS `cubic-bezier(x1, y1, x2, y2)` as a `(t) => t` easing function (like the CSS timing function). */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): EasingFn {
	if (x1 === y1 && x2 === y2) return (t) => t;
	const cx = 3 * x1;
	const bx = 3 * (x2 - x1) - cx;
	const ax = 1 - cx - bx;
	const cy = 3 * y1;
	const by = 3 * (y2 - y1) - cy;
	const ay = 1 - cy - by;
	const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
	const sampleY = (t: number) => ((ay * t + by) * t + cy) * t;
	const slopeX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
	const solveX = (x: number): number => {
		let t = x;
		for (let i = 0; i < 8; i++) {
			const err = sampleX(t) - x;
			if (Math.abs(err) < 1e-6) return t;
			const d = slopeX(t);
			if (Math.abs(d) < 1e-6) break;
			t -= err / d;
		}
		let lo = 0;
		let hi = 1;
		t = x;
		for (let i = 0; i < 32; i++) {
			const v = sampleX(t);
			if (Math.abs(v - x) < 1e-6) return t;
			if (v < x) lo = t;
			else hi = t;
			t = (lo + hi) / 2;
		}
		return t;
	};
	return (x) => (x <= 0 ? 0 : x >= 1 ? 1 : sampleY(solveX(x)));
}

/** Duration in ms: a number is used as is, a token name is read from the theme (`--atmr-motion-duration-<token>`). */
export function motionDuration(value: number | DurationToken, el?: Element | null): number {
	if (typeof value === 'number') return Math.max(0, value);
	const m = /^([\d.]+)(ms|s)$/.exec(readToken(`--atmr-motion-duration-${value}`, el));
	if (m) return m[2] === 's' ? parseFloat(m[1]) * 1000 : parseFloat(m[1]);
	return DURATION_FALLBACK[value] ?? DURATION_FALLBACK.m;
}

/** Easing function: a function is used as is, a token name is read from the theme (`--atmr-motion-easing-<token>`). */
export function motionEasing(value: EasingFn | EasingToken, el?: Element | null): EasingFn {
	if (typeof value === 'function') return value;
	const m = /^cubic-bezier\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)$/.exec(readToken(`--atmr-motion-easing-${value}`, el));
	const p = m ? [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4])] : (EASING_FALLBACK[value] ?? EASING_FALLBACK['productive-standard']);
	return cubicBezier(p[0], p[1], p[2], p[3]);
}

// ─── prefers-reduced-motion ──────────────────────────────────────────────────────────────────────────────────────

let reduced = $state(false);
if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
	const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
	reduced = mq.matches;
	mq.addEventListener?.('change', (e) => {
		reduced = e.matches;
	});
}

/** `true` when the user asked the OS / browser to reduce motion. Reactive. The extension never animates then. */
export function prefersReducedMotion(): boolean {
	return reduced;
}

// ─── context (ExtMotionProvider) ─────────────────────────────────────────────────────────────────────────────────

export interface ExtMotionContextValue {
	/** global mode */
	readonly mode: MotionMode;
	/** default engine for `mode: 'svelte'` */
	readonly type: MotionType;
	/** default options merged into every resolved motion */
	readonly options: MotionOptions;
	/** per-kind settings; win over `mode` (a component's own `motion` prop wins over these) */
	readonly overrides: Partial<Record<MotionKind, MotionOverride>>;
}

const KEY = Symbol('rt-ext-motion');
const NO_PROVIDER: ExtMotionContextValue = Object.freeze({ mode: 'off', type: 'tween', options: Object.freeze({}), overrides: Object.freeze({}) });

/** Called by ExtMotionProvider. */
export function setMotionContext(value: ExtMotionContextValue): void {
	setContext(KEY, value);
}

/** The nearest provider's settings (reactive getters), or a frozen 'off' context when there is no provider. Call at init. */
export function getMotionContext(): ExtMotionContextValue {
	return getContext<ExtMotionContextValue | undefined>(KEY) ?? NO_PROVIDER;
}

/**
 * The provider's mode for a kind (the value at the moment of the call; 'off' without a provider). Call at component init.
 * It does not look at a component's own `motion` prop and does not know about prefers-reduced-motion - use `useMotion()`
 * when you need the reactive, final answer.
 */
export function getMotionMode(kind?: MotionKind): MotionMode {
	const ctx = getMotionContext();
	const o = kind ? ctx.overrides[kind] : undefined;
	if (o !== undefined && o !== null) return o === false || o === 'off' ? 'off' : 'svelte';
	return ctx.mode;
}

// ─── resolving a motion setting ──────────────────────────────────────────────────────────────────────────────────

function toConfig(spec: MotionOverride, ctx: ExtMotionContextValue): ResolvedMotion | null {
	if (spec === false || spec === 'off' || spec === null || spec === undefined) return null;
	let type: MotionType = ctx.type;
	let own: MotionOptions = {};
	if (spec === 'tween' || spec === 'spring') type = spec;
	else if (typeof spec === 'object') {
		own = spec;
		type = spec.type ?? ctx.type;
	} else if (spec !== true && spec !== 'svelte') return null;
	const o: MotionOptions = { ...ctx.options, ...own };
	return {
		type,
		duration: motionDuration(o.duration ?? 'm'),
		delay: Math.max(0, o.delay ?? 0),
		easing: motionEasing(o.easing ?? 'productive-standard'),
		stiffness: o.stiffness ?? 0.15,
		damping: o.damping ?? 0.8,
		precision: o.precision,
		set: {
			duration: o.duration !== undefined,
			easing: o.easing !== undefined,
			delay: o.delay !== undefined,
			stiffness: o.stiffness !== undefined,
			damping: o.damping !== undefined,
			precision: o.precision !== undefined
		}
	};
}

/**
 * Component prop > provider per-kind override > provider mode > off. Does NOT look at prefers-reduced-motion
 * (see `useMotion().enabled`).
 */
export function resolveMotion(prop: MotionProp, kind: MotionKind | undefined, ctx: ExtMotionContextValue): ResolvedMotion | null {
	let spec: MotionOverride = prop;
	if (spec === undefined || spec === null) spec = kind ? ctx.overrides[kind] : undefined;
	if (spec === undefined || spec === null) spec = ctx.mode === 'svelte';
	return toConfig(spec, ctx);
}

export interface MotionHandle {
	/** The extension is switched on for this component (its prop / the provider), whatever the OS prefers. */
	readonly requested: boolean;
	/** `requested` and the user does not prefer reduced motion: the component should animate. */
	readonly enabled: boolean;
	/** 'svelte' when `enabled`, otherwise 'off' (= run the original path). */
	readonly mode: MotionMode;
	/** Resolved options; `null` unless `enabled`. */
	readonly config: ResolvedMotion | null;
	/** Params for the transition presets: `transition:rtFade={m.transition({ duration: 's' })}` (zero-length when off). */
	transition<P extends object = RtTransitionParams>(extra?: P): P & { enabled: boolean };
}

/**
 * What an extension-aware component calls at init:
 *
 *   const m = useMotion(() => motion, 'slider');   // `motion` = the component's own prop
 *   {#if m.enabled} ...Svelte transitions / Spring / Tween... {:else} ...the ORIGINAL markup... {/if}
 */
export function useMotion(prop?: MotionProp | (() => MotionProp), kind?: MotionKind): MotionHandle {
	const ctx = getMotionContext();
	const resolved = $derived.by(() => resolveMotion(typeof prop === 'function' ? prop() : prop, kind, ctx));
	const on = $derived(resolved !== null && !reduced);
	return {
		get requested() {
			return resolved !== null;
		},
		get enabled() {
			return on;
		},
		get mode() {
			return on ? 'svelte' : 'off';
		},
		get config() {
			return on ? resolved : null;
		},
		transition<P extends object = RtTransitionParams>(extra?: P) {
			return { ...(extra as P), enabled: on };
		}
	};
}

// ─── a value that follows its target (Tween / Spring) ────────────────────────────────────────────────────────────

interface Engine<T> {
	readonly type: MotionType;
	readonly value: T;
	animate(to: T, cfg: ResolvedMotion): void;
	snap(to: T): void;
}

const copy = <T>(v: T): T => (Array.isArray(v) ? ([...v] as T) : v);
const sameShape = (a: unknown, b: unknown): boolean => (Array.isArray(a) ? Array.isArray(b) && a.length === b.length : !Array.isArray(b));
const sameValue = (a: unknown, b: unknown): boolean => (Array.isArray(a) ? Array.isArray(b) && a.length === b.length && a.every((v, i) => v === b[i]) : a === b);

function createEngine<T extends number | number[]>(cfg: ResolvedMotion, from: T): Engine<T> {
	if (cfg.type === 'spring') {
		const s = new Spring<T>(copy(from), { stiffness: cfg.stiffness, damping: cfg.damping, precision: cfg.precision });
		return {
			type: 'spring',
			get value() {
				return s.current;
			},
			animate(to, c) {
				s.stiffness = c.stiffness;
				s.damping = c.damping;
				if (c.precision !== undefined) s.precision = c.precision;
				void s.set(copy(to));
			},
			snap(to) {
				void s.set(copy(to), { instant: true });
			}
		};
	}
	const t = new Tween<T>(copy(from));
	return {
		type: 'tween',
		get value() {
			return t.current;
		},
		animate(to, c) {
			void t.set(copy(to), { duration: c.duration, delay: c.delay, easing: c.easing });
		},
		snap(to) {
			void t.set(copy(to), { duration: 0 });
		}
	};
}

/**
 * Reduced-motion aware wrapper around `Tween` / `Spring`. `current` follows `target()`:
 *
 *  - `config()` is `null` (extension off, or the user prefers reduced motion): `current` IS `target()` - no lag, no
 *    extra frame, the original behaviour;
 *  - `immediate()` is true (e.g. a slider is being dragged): `current` is `target()` too and the engine is kept in
 *    sync, so releasing the pointer does not jump;
 *  - otherwise `current` glides to the target with a Tween (`config.duration` / `easing`) or a Spring
 *    (`config.stiffness` / `damping`). Numbers and number arrays are supported (an array whose length changes snaps).
 *
 * Call at component init (it creates an effect). Nothing is instantiated while `config()` is `null`.
 */
export function useMotionValue<T extends number | number[]>(target: () => T, config: () => ResolvedMotion | null, immediate?: () => boolean): { readonly current: T } {
	let engine = $state.raw<Engine<T> | undefined>(undefined);
	let last: T | undefined;

	$effect.pre(() => {
		const to = target();
		const cfg = config();
		const now = immediate ? immediate() : false;
		untrack(() => {
			if (!cfg) {
				// switched off: stop whatever is running and drop the engine
				if (engine) engine.snap(to);
				engine = undefined;
				last = undefined;
				return;
			}
			let created = false;
			if (!engine || engine.type !== cfg.type) {
				// first use, or the engine type changed: continue from what is on screen now
				const from = engine && sameShape(engine.value, to) ? engine.value : to;
				engine?.snap(from);
				engine = createEngine(cfg, from);
				created = true;
			}
			// only the config / pointer state changed, the target did not: keep the running animation
			if (!created && !now && last !== undefined && sameValue(last, to)) return;
			last = copy(to);
			if (now || !sameShape(engine.value, to)) engine.snap(to);
			else if (!(created && sameValue(engine.value, to))) engine.animate(to, cfg);
		});
	});

	return {
		get current(): T {
			const to = target();
			const cfg = config();
			if (!cfg || !engine || engine.type !== cfg.type || (immediate && immediate())) return to;
			const v = engine.value;
			return sameShape(v, to) ? v : to;
		}
	};
}

// ─── pointer press tracking (slider drag bypass) ─────────────────────────────────────────────────────────────────

export interface PressTracker {
	/** Call from the container's mousedown / touchstart. Does nothing while `enabled()` is false. */
	start(e: MouseEvent | TouchEvent): void;
	/**
	 * `true` while the pointer is down AND (the press began on a thumb OR the pointer has moved): dragging must be
	 * instantly responsive. A plain press on the track is `false`, so the thumb may glide to the clicked place.
	 */
	readonly immediate: boolean;
}

export function usePressTracker(opts: { enabled: () => boolean; isThumb: (target: EventTarget | null) => boolean }): PressTracker {
	let pressed = $state(false);
	let moved = $state(false);
	let onThumb = $state(false);
	let cleanup: (() => void) | undefined;

	function end() {
		cleanup?.();
		cleanup = undefined;
		pressed = false;
		moved = false;
		onThumb = false;
	}

	function start(e: MouseEvent | TouchEvent) {
		if (!opts.enabled()) return;
		end();
		pressed = true;
		onThumb = opts.isThumb(e.target);
		const touch = e.type.startsWith('touch');
		const onMove = () => {
			moved = true;
		};
		const moveType = touch ? 'touchmove' : 'mousemove';
		const upTypes = touch ? ['touchend', 'touchcancel'] : ['mouseup'];
		window.addEventListener(moveType, onMove, { passive: true, capture: true });
		for (const t of upTypes) window.addEventListener(t, end, { capture: true });
		cleanup = () => {
			window.removeEventListener(moveType, onMove, { capture: true });
			for (const t of upTypes) window.removeEventListener(t, end, { capture: true });
		};
	}

	$effect(() => end);

	return {
		start,
		get immediate() {
			return pressed && (onThumb || moved);
		}
	};
}
