<!-- EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. -->
<script lang="ts" generics="T">
	/** EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. */
	// Pie chart = `DonutChart` without a hole (`innerRadius = 0`); every other prop is the same. See DonutChart.svelte.
	import DonutChart from './DonutChart.svelte';
	import type { PieChartProps } from './types.js';

	let props: PieChartProps<T> = $props();
</script>

<DonutChart {...props} innerRadius={0} />
