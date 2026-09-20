<script lang="ts">
	import Slider from '$lib/components/Slider/Slider.svelte';
	import { marksExample } from './constants.js';
	import { getSubWithPercentages } from './utils.js';
	import './styles.css';
</script>

<Slider size="m" variant="primary" min={1} max={10} value={[3]} marks={marksExample} label="Label" subLabel={getSubWithPercentages} />
<Slider size="m" variant="primary" min={1} max={10} value={[1, 3]} marks={marksExample} label="Label" subLabel={getSubWithPercentages} />
