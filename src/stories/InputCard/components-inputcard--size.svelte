<script lang="ts">
	import { INPUT_SIZES } from '$lib/components/Input/constants.js';
	import InputCard from '$lib/components/InputCard/InputCard.svelte';
	import ExamplesDecorator from '../_utils/ExamplesDecorator.svelte';
</script>

<ExamplesDecorator>
	{#each Object.values(INPUT_SIZES) as v}
		<InputCard size={v} label="size {v}" style={{ width: '220px' }} />
	{/each}
</ExamplesDecorator>
