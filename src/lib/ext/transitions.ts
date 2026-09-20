/** EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. */
// Reusable Svelte transition presets for the author's extension layer (see src/lib/ext/README.md).
//
// Thin wrappers around `svelte/transition` (fade / scale / fly / slide) and `svelte/animate` (flip) that
//  - take their durations and easings from the DESIGN TOKENS of the active theme (`--atmr-motion-duration-*`,
//    `--atmr-motion-easing-*`, with the same values as a fallback), so they follow the four themes;
//  - accept a token name or a number for `duration` and a token name or a function for `easing`;
//  - are ZERO-LENGTH (`{ duration: 0 }`) when `enabled` is false or when the user prefers reduced motion.
//
// Later work can plug them into Modal / Drawer / Popover / Tooltip / Dropdown / Toast / Accordion / Tabs / TableGrid rows:
//
//   const m = useMotion(() => motion, 'modal');
//   {#if open}<div transition:rtFade={m.transition()}>...</div>{/if}      // instant unless motion is on
//
// They are NOT used by any original component now: the originals keep their react-transition-group-style class
// sequences (the 'off' path), which the pixel comparison verifies.
import { flip } from 'svelte/animate';
import { fade, fly, scale, slide, type TransitionConfig } from 'svelte/transition';
import { motionDuration, motionEasing, prefersReducedMotion, type DurationToken, type EasingFn, type EasingToken } from './motion.svelte.js';

export interface RtTransitionParams {
	/** `false` makes the transition zero-length (instant). Components pass `useMotion().enabled` (see `m.transition()`). Default: true. */
	enabled?: boolean;
	/** ms or a duration token: '2xs' 100, 'xs' 150, 's' 200, 'm' 300, 'l' 600, 'xl' 1200. */
	duration?: number | DurationToken;
	/** ms */
	delay?: number;
	/** easing function or an easing token ('productive-standard', 'expressive-entrance', ...). */
	easing?: EasingFn | EasingToken;
}
export interface RtFadeParams extends RtTransitionParams {}
export interface RtScaleParams extends RtTransitionParams {
	/** scale at the start of `in` / end of `out` (default 0.95) */
	start?: number;
	/** opacity at the start of `in` / end of `out` (default 0) */
	opacity?: number;
}
export interface RtFlyParams extends RtTransitionParams {
	/** offset in px (or a CSS length string) (default 0) */
	x?: number | string;
	/** offset in px (or a CSS length string) (default 12) */
	y?: number | string;
	/** opacity at the start of `in` / end of `out` (default 0) */
	opacity?: number;
}
export interface RtSlideParams extends RtTransitionParams {
	/** axis of the size that collapses (default 'y' = height) */
	axis?: 'x' | 'y';
}
export interface RtShiftParams extends RtTransitionParams {
	/** axis of the movement (default 'x') */
	axis?: 'x' | 'y';
	/** +1: the content travels towards the start (the NEXT page arrives from the end side), -1: towards the end (the PREVIOUS page). Default 1. */
	dir?: 1 | -1;
	/** distance in px (default 20) */
	distance?: number;
	/** 'shift' (default): translate + fade (a page change); 'zoom': scale from `start` + fade (a view change) */
	kind?: 'shift' | 'zoom';
	/** zoom: scale at the start of `in` / end of `out` (default 0.97) */
	start?: number;
	/** `out` only: take the leaving element out of the flow (it keeps its place, its box and its size) so that the arriving one takes over. Default true. */
	detach?: boolean;
}

/** The zero-length transition used when motion is off. */
const INSTANT: TransitionConfig = { duration: 0 };

interface Base {
	duration: number;
	delay: number;
	easing: EasingFn;
}

/** Resolves params against the theme tokens of `node`; `null` = run instantly. */
function base(node: Element, p: RtTransitionParams, duration: DurationToken, easing: EasingToken): Base | null {
	if (p.enabled === false || prefersReducedMotion()) return null;
	return {
		duration: motionDuration(p.duration ?? duration, node),
		delay: Math.max(0, p.delay ?? 0),
		easing: motionEasing(p.easing ?? easing, node)
	};
}

/** Opacity fade (default: 's' = 200 ms, 'productive-standard'). */
export function rtFade(node: Element, params: RtFadeParams = {}): TransitionConfig {
	const b = base(node, params, 's', 'productive-standard');
	return b ? fade(node, b) : INSTANT;
}

/** Scale + fade (default: 's' = 200 ms, 'productive-entrance', from 0.95). For popovers, tooltips, menus, toasts. */
export function rtScale(node: Element, params: RtScaleParams = {}): TransitionConfig {
	const b = base(node, params, 's', 'productive-entrance');
	return b ? scale(node, { ...b, start: params.start ?? 0.95, opacity: params.opacity ?? 0 }) : INSTANT;
}

/** Fly (translate) + fade (default: 'm' = 300 ms, 'expressive-entrance', 12 px up). For modals, drawers, toasts. */
export function rtFly(node: Element, params: RtFlyParams = {}): TransitionConfig {
	const b = base(node, params, 'm', 'expressive-entrance');
	return b ? fly(node, { ...b, x: params.x ?? 0, y: params.y ?? 12, opacity: params.opacity ?? 0 }) : INSTANT;
}

/** Height (or width) collapse (default: 'm' = 300 ms, 'productive-standard'). For accordions, panels, table row details. */
export function rtSlide(node: Element, params: RtSlideParams = {}): TransitionConfig {
	const b = base(node, params, 'm', 'productive-standard');
	return b ? slide(node, { ...b, axis: params.axis ?? 'y' }) : INSTANT;
}

/**
 * Takes a LEAVING element out of the layout flow without moving it: `position: absolute` with no offsets keeps the "static position" the
 * element had in the flow (in a block, flex or grid parent alike), the used width / height are pinned so it keeps its box. The arriving sibling
 * then takes the flow place, so the two overlap while they cross-fade.
 */
function detach(node: HTMLElement): void {
	const cs = getComputedStyle(node);
	if (cs.position === 'absolute' || cs.position === 'fixed') return;
	const s = node.style;
	if (/px$/.test(cs.width)) s.width = cs.width;
	if (/px$/.test(cs.height)) s.height = cs.height;
	s.position = 'absolute';
	s.pointerEvents = 'none';
}

/**
 * Shared-axis page change: translate + fade along an axis, the leaving content moves the opposite way (default: 'm' = 300 ms,
 * 'productive-standard', 20 px). Use as `in:rtShift` + `out:rtShift` on the content of a `{#key page}` block; `dir` (+1 next / -1 previous)
 * picks the side. With `kind: 'zoom'` it scales from 0.97 instead (a change of view). The `out` leg detaches the element (see `detach`).
 */
export function rtShift(node: Element, params: RtShiftParams = {}, options?: { direction?: 'in' | 'out' | 'both' }): TransitionConfig {
	const b = base(node, params, 'm', 'productive-standard');
	if (!b) return INSTANT;
	const leaving = options?.direction === 'out';
	if (leaving && params.detach !== false) detach(node as HTMLElement);
	const style = getComputedStyle(node);
	const opacity = +style.opacity;
	const transform = style.transform === 'none' ? '' : style.transform;
	if (params.kind === 'zoom') {
		const from = params.start ?? 0.97;
		return { ...b, css: (t) => `transform: ${transform} scale(${from + (1 - from) * t}); opacity: ${opacity * t}` };
	}
	const axis = params.axis === 'y' ? 'Y' : 'X';
	const sign = (params.dir ?? 1) * (leaving ? -1 : 1);
	const distance = params.distance ?? 20;
	return { ...b, css: (_t, u) => `transform: ${transform} translate${axis}(${sign * distance * u}px); opacity: ${opacity * (1 - u)}` };
}

/** `animate:rtFlip` for keyed `{#each}` reordering (table rows, tabs, tags); same tokens / gating as the transitions. */
export function rtFlip(node: Element, rects: { from: DOMRect; to: DOMRect }, params: RtTransitionParams = {}) {
	const b = base(node, params, 'm', 'productive-standard');
	return b ? flip(node, rects, b) : { duration: 0 };
}
