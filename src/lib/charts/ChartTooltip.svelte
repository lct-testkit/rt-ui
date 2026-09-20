<!-- EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. -->
<script lang="ts">
	/** EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. */
	// Tooltip of a chart. It is absolutely positioned inside the plot (`.rt-chart__plot` is `position: relative`) and never takes part
	// in the layout, so opening it cannot move anything; it stays mounted (invisible while closed) so its size is always known and it can
	// flip / clamp itself to the plot. `x` / `y` is the anchor in plot pixels; the box sits to the right of it and flips to the left near
	// the edge. The values lead (strong), the names follow (soft), a series is keyed by a short stroke of its colour, not by a box.
	// It is decorative for assistive technology (`aria-hidden`): the same text is the `aria-label` of the focusable data points.
	import clsx from 'clsx';
	import './charts.css';
	import type { TooltipContent, TooltipModel } from './types.js';

	interface Props {
		/** what to show (`null`: nothing yet) */
		model: TooltipModel | null;
		/** anchor, px inside the plot */
		x: number;
		y: number;
		/** size of the plot, px (the tooltip is kept inside it) */
		width: number;
		height: number;
		/** 0..1; at 0 the tooltip is hidden (the parent animates it with the chart's motion) */
		opacity?: number;
		/** gap between the anchor and the box, px */
		offset?: number;
		/** shape of the key in front of a row */
		marker?: 'line' | 'dot';
		/** replaces the rows */
		content?: TooltipContent;
		class?: string;
	}

	let { model, x, y, width, height, opacity = 1, offset = 14, marker = 'line', content, class: className }: Props = $props();

	let boxW = $state(0);
	let boxH = $state(0);
	const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

	/** right of the anchor, left when there is no room, always inside the plot */
	const left = $derived.by(() => {
		let l = x + offset;
		if (l + boxW > width) l = x - offset - boxW;
		return clamp(l, 0, Math.max(0, width - boxW));
	});
	const top = $derived(clamp(y - boxH / 2, 0, Math.max(0, height - boxH)));
</script>

<div
	class={clsx('rt-chart__tooltip', className)}
	aria-hidden="true"
	data-open={opacity > 0.01 ? 'true' : 'false'}
	bind:offsetWidth={boxW}
	bind:offsetHeight={boxH}
	style:transform="translate({Math.round(left)}px, {Math.round(top)}px)"
	style:opacity
	style:visibility={opacity > 0.01 && model ? 'visible' : 'hidden'}
>
	{#if model}
		{#if content}
			{@render content(model)}
		{:else}
			{#if model.title}<p class="rt-chart__tooltip-title">{model.title}</p>{/if}
			{#each model.rows as row (row.key)}
				<div class={clsx('rt-chart__tooltip-row', row.active && 'rt-chart__tooltip-row--active')} style="--rt-c: {row.color}">
					<span class={clsx('rt-chart__tooltip-key', marker === 'dot' && 'rt-chart__tooltip-key--dot')}></span>
					<span class="rt-chart__tooltip-label">{row.label}</span>
					<span class="rt-chart__tooltip-value">{row.text}</span>
					{#if row.shareText !== undefined}<span class="rt-chart__tooltip-share">{row.shareText}</span>{/if}
				</div>
			{/each}
		{/if}
	{/if}
</div>
