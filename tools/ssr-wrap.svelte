<!-- Helper of tools/check-charts-ssr.mjs: a line chart inside an ExtMotionProvider (server-side output must still be a finished chart, and `data-motion` shows how the provider / `overrides.chart` / the `animate` prop resolved). -->
<script lang="ts">
	import { LineChart } from '$lib/charts';
	import ExtMotionProvider from '$lib/ext/ExtMotionProvider.svelte';
	import type { MotionMode, MotionOverride } from '$lib/ext/motion.svelte.js';

	let {
		data,
		mode = 'svelte',
		overrides = {},
		animate
	}: { data: { month: Date; fact: number | null; plan: number }[]; mode?: MotionMode; overrides?: Record<string, MotionOverride>; animate?: boolean } = $props();
</script>

<ExtMotionProvider {mode} {overrides}>
	<LineChart {data} x="month" series={[{ key: 'f', label: 'Факт', y: 'fact' }]} label="Выручка" {animate} />
</ExtMotionProvider>
