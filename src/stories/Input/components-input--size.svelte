<script lang="ts">
	import Input from '$lib/components/Input/Input.svelte';
	import { INPUT_SIZES } from '$lib/components/Input/constants.js';
	import DecorateStory from '../_utils/DecorateStory.svelte';
	import ExamplesDecorator from '../_utils/ExamplesDecorator.svelte';
</script>

<DecorateStory>
	<ExamplesDecorator>
		{#each Object.values(INPUT_SIZES) as v}
			<Input size={v} label="size {v}" style="min-width: 220px" />
		{/each}
	</ExamplesDecorator>
</DecorateStory>
