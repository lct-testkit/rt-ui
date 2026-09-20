/** EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. */
// Motion of the chart module. It reuses the author's motion layer (../../ext/motion.svelte.ts) instead of inventing another mechanism:
//
//   the `animate` prop of a chart = the `motion` prop of the ext components (MotionProp): undefined -> inherit ExtMotionProvider
//   (no provider = OFF), false -> off, true / 'tween' / 'spring' / { duration, easing, stiffness ... } -> on;
//   `ExtMotionProvider overrides={{ chart: ... }}` switches every chart at once; prefers-reduced-motion: reduce always wins.
//
// What moves (only with motion on): the draw-in on mount (a Tween from 0 to 1 that reveals lines / grows bars / sweeps arcs),
// the morph when data changes (numbers glide with a Tween / Spring via `useMotionValue`), the hover emphasis and the pointer-following
// crosshair / tooltip (a short Tween). With motion off every value IS its target: no extra frame, no timers, no animation objects.
import { onMount } from 'svelte';
import { cubicOut } from 'svelte/easing';
import { Tween } from 'svelte/motion';
import { useMotion, useMotionValue, type MotionProp, type ResolvedMotion } from '../../ext/motion.svelte.js';

/** The `MotionKind` of the charts: `<ExtMotionProvider overrides={{ chart: 'off' }}>` etc. */
export const CHART_MOTION_KIND = 'chart';

export interface ChartMotion {
	/** motion is on for this chart (its `animate` prop / the provider) and the user does not prefer reduced motion */
	readonly enabled: boolean;
	/** resolved options (`null` while motion is off) */
	readonly config: ResolvedMotion | null;
	/** draw-in progress 0 → 1 (always 1 with motion off, and after the intro) */
	readonly intro: number;
	/** plays the draw-in again (the chart got its data after it was mounted empty); does nothing while motion is off */
	replay(): void;
	/** `current` glides to `target()` (Tween / Spring of the chart's motion); it IS `target()` while motion is off. Numbers only (NaN stays NaN). */
	follow(target: () => number[]): { readonly current: number[] };
	/** the same for pointer-following values (crosshair, tooltip): always a short Tween, so it never lags behind the mouse */
	pointer(target: () => number[]): { readonly current: number[] };
}

/** Call at component init. `animate` is the component's own prop (a getter, so it stays reactive). */
export function useChartMotion(animate: () => MotionProp): ChartMotion {
	const m = useMotion(animate, CHART_MOTION_KIND);

	// draw-in: starts at 0 in the browser when motion is on (no flash of a finished chart), at 1 on the server / with motion off
	const introTween = new Tween(m.enabled && typeof window !== 'undefined' ? 0 : 1);
	function play() {
		const cfg = m.config;
		if (!cfg) {
			void introTween.set(1, { duration: 0 });
			return;
		}
		void introTween.set(1, {
			// a draw-in wants to be slower than a state change unless the caller chose the timing
			duration: cfg.set?.duration ? cfg.duration : 800,
			delay: cfg.delay,
			easing: cfg.set?.easing ? cfg.easing : cubicOut
		});
	}
	onMount(play);

	const pointerConfig = (): ResolvedMotion | null => {
		const cfg = m.config;
		return cfg ? { ...cfg, type: 'tween', duration: 140, delay: 0, easing: cubicOut } : null;
	};

	return {
		get enabled() {
			return m.enabled;
		},
		get config() {
			return m.config;
		},
		get intro() {
			return m.enabled ? introTween.current : 1;
		},
		replay() {
			if (!m.enabled) return;
			void introTween.set(0, { duration: 0 });
			play();
		},
		follow: (target) => useMotionValue(target, () => m.config),
		pointer: (target) => useMotionValue(target, pointerConfig)
	};
}
