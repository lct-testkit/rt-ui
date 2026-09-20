/** EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. */
// The categorical palette of the chart module. The colours themselves are CSS variables `--rt-chart-1 … --rt-chart-10` defined in
// ../charts.css on every `.rt-chart` (and on `.rt-chart-palette` for use outside a chart) from the design-system ramps, so all four
// themes work without code changes and a consumer can override any of them. Here: the small typed helpers around them.

/** Number of colours in the categorical palette (`--rt-chart-1 … --rt-chart-10`). Series beyond that reuse the colours (fold the tail into "Другое" instead). */
export const CHART_COLOR_COUNT = 10;

/** CSS colour of the neutral "Other" / de-emphasis slot. */
export const CHART_OTHER_COLOR = 'var(--rt-chart-other)';

/**
 * CSS colour of the `index`-th (0-based) series: `var(--rt-chart-N)`. The colour follows the entity, never its rank:
 * give a series the index it has in YOUR list of all series, not in the list of the currently visible ones.
 */
export function chartColor(index: number): string {
	const i = ((Math.trunc(index) % CHART_COLOR_COUNT) + CHART_COLOR_COUNT) % CHART_COLOR_COUNT;
	return `var(--rt-chart-${i + 1})`;
}

/** Design-system colour ramps usable for an ordinal / sequential ramp. */
export type RampHue = 'accent' | 'info' | 'success' | 'warning' | 'error' | 'neutral' | 'status-01' | 'status-02' | 'status-03' | 'status-04' | 'status-05' | 'status-06';

/**
 * `count` colours of ONE hue from light to dark (steps 300 → 600 of the design-system ramp, mixed in OKLab, then nudged toward the text
 * colour of the theme like the palette itself): for ORDERED categories (funnel stages, tiers) where the order, not the identity, is what
 * the colour says. Both ends stay above 2:1 on a light and on a dark surface. Never use it for nominal categories.
 */
export function chartRamp(count: number, hue: RampHue = 'accent'): string[] {
	const n = Math.max(0, Math.floor(count));
	return Array.from({ length: n }, (_, i) => {
		const dark = n === 1 ? 50 : Math.round((i / (n - 1)) * 100);
		return `color-mix(in oklab, var(--atmr-fg-default) var(--rt-chart-tint, 12%), color-mix(in oklab, var(--atmr-${hue}-600) ${dark}%, var(--atmr-${hue}-300)))`;
	});
}
