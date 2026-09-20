<!-- EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. -->
<script lang="ts">
	/** EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. */
	// Legend of a chart: a swatch that mirrors the mark (a line key, a bar rectangle or a dot) + the name (+ value and share for
	// donut / pie). Clickable: every item is a toggle button (`aria-pressed`) that hides / shows its series; hovering or focusing an item
	// emphasises the series in the chart (`onHighlight`). Without `onToggle` it is a plain list.
	import clsx from 'clsx';
	import './charts.css';
	import type { LegendItem } from './types.js';

	interface Props {
		items: LegendItem[];
		/** the item was clicked: hide / show the series `key` */
		onToggle?: (key: string) => void;
		/** the pointer / keyboard focus is on the series `key` (`null`: left) */
		onHighlight?: (key: string | null) => void;
		/** `'row'` (default): wraps above / below a chart; `'column'`: a list with a value and a share column (donut / pie) */
		layout?: 'row' | 'column';
		/** accessible name of the list */
		label?: string;
		class?: string;
	}

	let { items, onToggle, onHighlight, layout = 'row', label = 'Легенда', class: className }: Props = $props();
</script>

{#snippet content(item: LegendItem)}
	<span class={clsx('rt-chart__swatch', `rt-chart__swatch--${item.marker ?? 'rect'}`)} aria-hidden="true"></span>
	<span class="rt-chart__legend-label">{item.label}</span>
	{#if item.value !== undefined}<span class="rt-chart__legend-value">{item.value}</span>{/if}
	{#if item.secondary !== undefined}<span class="rt-chart__legend-secondary">{item.secondary}</span>{/if}
{/snippet}

{#if items.length}
	<ul class={clsx('rt-chart__legend', layout === 'column' && 'rt-chart__legend--column', className)} aria-label={label}>
		{#each items as item (item.key)}
			<li style="--rt-c: {item.color}">
				{#if onToggle}
					<button
						type="button"
						class="rt-chart__legend-item"
						aria-pressed={!item.hidden}
						data-key={item.key}
						onclick={() => onToggle(item.key)}
						onpointerenter={() => onHighlight?.(item.key)}
						onpointerleave={() => onHighlight?.(null)}
						onfocus={() => onHighlight?.(item.key)}
						onblur={() => onHighlight?.(null)}
					>
						{@render content(item)}
					</button>
				{:else}
					<span class="rt-chart__legend-item" style="cursor: default" data-key={item.key}>
						{@render content(item)}
					</span>
				{/if}
			</li>
		{/each}
	</ul>
{/if}
