<script lang="ts">
	import Slider from '$lib/components/Slider/Slider.svelte';
	import { getSubWithPercentages } from './utils.js';
	import './styles.css';
</script>

<div style="display: flex; gap: var(--atmr-spacing-5x); flex-direction: column; align-items: flex-start; width: 100%">
	<Slider value={[1]} subLabel={getSubWithPercentages} min={0} max={10} />
	<Slider value={[4, 7]} subLabel={getSubWithPercentages} min={1} max={10} disableSwap />
</div>
