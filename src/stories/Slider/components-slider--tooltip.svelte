<script lang="ts">
	import Slider from '$lib/components/Slider/Slider.svelte';
	import { marksExample } from './constants.js';
	import './styles.css';
</script>

<Slider size="m" variant="primary" min={1} max={10} value={[3]} marks={marksExample} label="Label" tooltip="always" />
