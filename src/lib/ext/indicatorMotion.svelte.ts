/** EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. */
// A sliding indicator: one absolutely positioned element that GLIDES from the box of the previously selected item to the box of the newly selected one
// (the underline of the active tab in Tabs); see src/lib/ext/README.md, "Tabs".
//
// The original marks the selected tab with a `::after` of the TAB ITSELF (its width transitions 0 -> 100 % in CSS), so the mark never travels between tabs.
// With the extension on TabsGroup renders one `span.rt-ext-tabs-indicator` and this hook writes its INLINE `left` / `top` / `width` / `height`:
//
//   * the first placement and every change of the layout of the SAME target (window resize, a font that has just loaded) are instant;
//   * a change of the TARGET (another tab became selected) moves the box with a Svelte `Tween` (duration + easing) or `Spring` (stiffness + damping):
//     every side of the box is interpolated from where the indicator is drawn right now (so an interrupted move continues smoothly), a Spring may
//     overshoot a little and settle.
//
//   const ind = useIndicatorMotion({ m, container: () => tablist, indicator: () => bar, target: () => tablist?.querySelector('.atmr-tabs-item--selected') });
import { tick, untrack } from 'svelte';
import { Driver, SPRING, type DriveLeg } from './driver.svelte.js';
import { motionDuration, motionEasing, type MotionHandle, type MotionProp } from './motion.svelte.js';

export interface IndicatorRect {
	left: number;
	top: number;
	width: number;
	height: number;
}

export interface IndicatorMotionOptions {
	/** the component's `useMotion()` handle: the indicator is only moved smoothly while `m.enabled` (otherwise it jumps) */
	m: MotionHandle;
	/** the (positioned) element the indicator lives in */
	container: () => HTMLElement | null | undefined;
	/** the indicator element (`position: absolute`) */
	indicator: () => HTMLElement | null | undefined;
	/**
	 * The element the indicator marks (`null` / `undefined`: nothing is marked, the indicator is hidden). Read reactively: it must depend on
	 * whatever selects the element (the active index), and it is read after the DOM update.
	 */
	target: () => HTMLElement | null | undefined;
	/** the component's own `motion` prop */
	prop?: () => MotionProp;
	/** box of the indicator for a target, in the coordinates of the container (default: the bottom edge of the target, `thickness` px high) */
	measure?: (target: HTMLElement, container: HTMLElement) => IndicatorRect;
	/** height (px) of the bottom line for the default `measure` (default: read from the `::after` of the target, else 2) */
	thickness?: (target: HTMLElement) => number;
}

export interface IndicatorMotion {
	/** reactive: the indicator is moving */
	readonly running: boolean;
	/** measures the target again (call after something changed the layout without changing the target) */
	relayout(): void;
}

const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const same = (a: IndicatorRect, b: IndicatorRect) => Math.abs(a.left - b.left) < 0.25 && Math.abs(a.top - b.top) < 0.25 && Math.abs(a.width - b.width) < 0.25 && Math.abs(a.height - b.height) < 0.25;
const px = (n: number) => `${Math.round(n * 100) / 100}px`;

/** Call at component init (it creates effects). */
export function useIndicatorMotion(o: IndicatorMotionOptions): IndicatorMotion {
	const d = new Driver(1);
	let from: IndicatorRect | null = null;
	let to: IndicatorRect | null = null;
	let lastTarget: HTMLElement | null = null;
	let running = $state(false);
	let gen = 0;

	const defaultMeasure = (t: HTMLElement, c: HTMLElement): IndicatorRect => {
		let thickness = 2;
		if (o.thickness) thickness = o.thickness(t);
		else {
			const h = parseFloat(getComputedStyle(t, '::after').height);
			if (h > 0) thickness = h;
		}
		// the padding box of the target (where its own `::after` is drawn) in the coordinates of the container's padding box; fractional, like the layout
		const tr = t.getBoundingClientRect();
		const cr = c.getBoundingClientRect();
		const left = tr.left + t.clientLeft - cr.left - c.clientLeft;
		const bottom = tr.top + t.clientTop + t.clientHeight - cr.top - c.clientTop;
		return { left, top: bottom - thickness, width: tr.width - 2 * t.clientLeft, height: thickness };
	};

	function current(): IndicatorRect | null {
		if (!to) return null;
		if (!from || !running) return to;
		const p = d.value;
		return { left: lerp(from.left, to.left, p), top: lerp(from.top, to.top, p), width: Math.max(0, lerp(from.width, to.width, p)), height: lerp(from.height, to.height, p) };
	}

	function write(r: IndicatorRect | null) {
		const el = o.indicator();
		if (!el) return;
		if (!r) {
			el.style.setProperty('width', '0px');
			el.style.setProperty('opacity', '0');
			return;
		}
		el.style.setProperty('left', px(r.left));
		el.style.setProperty('top', px(r.top));
		el.style.setProperty('width', px(r.width));
		el.style.setProperty('height', px(r.height));
		el.style.setProperty('opacity', '1');
	}

	function leg(el: HTMLElement): DriveLeg {
		const cfg = o.m.config!;
		return {
			type: cfg.type,
			duration: cfg.set.duration ? cfg.duration : motionDuration('m', el),
			easing: cfg.set.easing ? cfg.easing : motionEasing('productive-standard', el),
			delay: cfg.delay,
			stiffness: cfg.set.stiffness ? cfg.stiffness : SPRING.lively.stiffness,
			damping: cfg.set.damping ? cfg.damping : SPRING.lively.damping,
			precision: cfg.set.precision ? cfg.precision : 0.01
		};
	}

	function place() {
		const c = o.container();
		const el = o.indicator();
		const t = o.target() ?? null;
		if (!c || !el) return;
		if (!t) {
			gen++;
			running = false;
			from = to = null;
			lastTarget = null;
			d.freeze();
			write(null);
			return;
		}
		const next = (o.measure ?? defaultMeasure)(t, c);
		const targetChanged = t !== lastTarget;
		lastTarget = t;
		if (!to) {
			to = next;
			from = null;
			running = false;
			write(to);
			return;
		}
		if (same(to, next)) return;
		if (!targetChanged || !o.m.enabled || !o.m.config) {
			// the layout of the same target changed (or motion is off): follow at once
			gen++;
			running = false;
			from = null;
			to = next;
			d.freeze();
			write(to);
			return;
		}
		from = current();
		to = next;
		d.jump(0);
		running = true;
		const g = ++gen;
		write(from);
		void d.go(1, leg(el)).then(() => {
			if (g !== gen) return;
			running = false;
			from = null;
			write(to);
		});
	}

	// a new target (the active index changed) or a new layout. The class of the selected tab is set by ANOTHER component's render effect, which may run
	// after this effect within the same flush: read the DOM once the flush is over (`tick()`; still before the browser paints).
	$effect(() => {
		void o.target();
		void o.container();
		void o.indicator();
		let cancelled = false;
		void tick().then(() => {
			if (!cancelled) untrack(place);
		});
		return () => {
			cancelled = true;
		};
	});

	// every frame of the move
	$effect(() => {
		void d.value;
		untrack(() => {
			if (running) write(current());
		});
	});

	// the layout of the container / of the target changes (resize, fonts, tabs added) without a new target
	$effect(() => {
		const c = o.container();
		if (!c || typeof ResizeObserver === 'undefined') return;
		const ro = new ResizeObserver(() => untrack(place));
		ro.observe(c);
		const t = untrack(() => o.target());
		if (t) ro.observe(t);
		return () => ro.disconnect();
	});

	$effect(() => () => {
		gen++;
		running = false;
	});

	return {
		get running() {
			return running;
		},
		relayout: () => untrack(place)
	};
}
