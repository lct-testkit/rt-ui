<script lang="ts">
	import Slider from '$lib/components/Slider/Slider.svelte';
	import './styles.css';
</script>

<Slider value={[1]} label="Label" subLabel={() => ''} min={1} max={10} />
