<!-- EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. -->
<svelte:options namespace="svg" />

<script lang="ts">
	/** EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. */
	// Axis of a chart (SVG `<g>` to be placed inside an `<svg>`): tick labels in the design-system caption type (tabular figures) and an
	// optional axis line. `bottom`: labels under a horizontal axis (x); `left`: labels right-aligned in front of a vertical axis (y).
	// The ticks come ready: value, position in px along the axis and label (see `niceTicks` / `timeTicks`).
	import './charts.css';
	import type { AxisTick } from './types.js';

	interface Props {
		ticks: AxisTick[];
		orient?: 'bottom' | 'left';
		/** length of the axis line, px */
		length: number;
		/** distance between the axis and its labels, px */
		gap?: number;
		/** draw the axis line */
		line?: boolean;
		/** text anchor of the bottom labels: `middle` (default), or `start` / `end` for the outermost ones */
		anchorOf?: (tick: AxisTick, index: number) => 'start' | 'middle' | 'end';
		/** rotate the bottom labels by this angle, degrees (negative = counter-clockwise, e.g. -35); the labels then end at their tick */
		rotate?: number;
	}

	let { ticks, orient = 'bottom', length, gap = 8, line = true, anchorOf, rotate = 0 }: Props = $props();
	const snap = (v: number) => Math.round(v) + 0.5;
</script>

<g class="rt-chart__axis rt-chart__axis--{orient}" aria-hidden="true">
	{#if line}
		{#if orient === 'bottom'}
			<line class="rt-chart__axis-line" x1="0" x2={length} y1="0.5" y2="0.5" />
		{:else}
			<line class="rt-chart__axis-line" x1="0.5" x2="0.5" y1="0" y2={length} />
		{/if}
	{/if}
	{#each ticks as t, i}
		{#if orient === 'bottom' && rotate}
			<text class="rt-chart__tick rt-chart__tick--x" x={snap(t.pos)} y={gap + 8} text-anchor="end" transform="rotate({rotate} {snap(t.pos)} {gap + 8})">{t.lines?.[0] ?? t.label}</text>
		{:else if orient === 'bottom'}
			<text class="rt-chart__tick rt-chart__tick--x" x={snap(t.pos)} y={gap + 10} text-anchor={anchorOf?.(t, i) ?? 'middle'}>
				{#if t.lines && t.lines.length > 1}
					{#each t.lines as line, li}<tspan x={snap(t.pos)} dy={li === 0 ? 0 : 14}>{line}</tspan>{/each}
				{:else}{t.lines?.[0] ?? t.label}{/if}
			</text>
		{:else}
			{#if t.lines && t.lines.length > 1}
				<text class="rt-chart__tick rt-chart__tick--y" x={-gap} y={t.pos} text-anchor="end">
					{#each t.lines as line, li}<tspan x={-gap} dy={li === 0 ? `${0.32 - (t.lines.length - 1) * 0.6}em` : '1.2em'}>{line}</tspan>{/each}
				</text>
			{:else}
				<text class="rt-chart__tick rt-chart__tick--y" x={-gap} y={t.pos} dy="0.32em" text-anchor="end">{t.lines?.[0] ?? t.label}</text>
			{/if}
		{/if}
	{/each}
</g>
