<script lang="ts">
	import Slider from '$lib/components/Slider/Slider.svelte';
	import { marksExample } from './constants.js';
	import './styles.css';
</script>

<div style="display: flex; gap: var(--atmr-spacing-5x); flex-direction: column; align-items: flex-start; width: 100%">
	{#each [[4, 7], [1, 3, 8]] as v}
		<Slider size="m" variant="primary" marks={marksExample} value={v} label="{v.length} values" min={1} max={10} disableSwap />
	{/each}
</div>
