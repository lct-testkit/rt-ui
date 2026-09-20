<!-- EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. -->
<svelte:options namespace="svg" />

<script lang="ts">
	/** EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. */
	// Gridlines of a chart (SVG `<g>` to be placed inside an `<svg>`): one hairline per tick, solid (never dashed), recessive.
	// `horizontal`: lines across the plot at the y positions of the ticks; `vertical`: lines down the plot at the x positions.
	import './charts.css';
	import type { AxisTick } from './types.js';

	interface Props {
		ticks: AxisTick[];
		/** `horizontal` lines run along x (they mark y ticks), `vertical` lines run along y */
		orient?: 'horizontal' | 'vertical';
		/** length of every line, px (the plot width for horizontal lines, its height for vertical ones) */
		length: number;
	}

	let { ticks, orient = 'horizontal', length }: Props = $props();
	/** hairlines are crisp on whole pixels + 0.5 */
	const snap = (v: number) => Math.round(v) + 0.5;
</script>

<g class="rt-chart__grid" aria-hidden="true">
	{#each ticks as t}
		{#if orient === 'horizontal'}
			<line x1="0" x2={length} y1={snap(t.pos)} y2={snap(t.pos)} />
		{:else}
			<line x1={snap(t.pos)} x2={snap(t.pos)} y1="0" y2={length} />
		{/if}
	{/each}
</g>
