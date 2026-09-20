<script lang="ts">
	import Chip from '$lib/components/Chip/Chip/Chip.svelte';
	import './styles.css';
	import { CHIP_VARIANTS } from '$lib/components/Chip/constants.js';
	import ExamplesDecorator from '../_utils/ExamplesDecorator.svelte';
</script>

<ExamplesDecorator>
	{#each Object.values(CHIP_VARIANTS) as v}
		<Chip variant={v} label="Chip" />
	{/each}
</ExamplesDecorator>
