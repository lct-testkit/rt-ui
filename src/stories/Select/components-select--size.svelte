<script lang="ts">
	// Port of stories/Select Size, decorator `examplesDecorator`
	import ExamplesDecorator from '../_utils/ExamplesDecorator.svelte';
	import Select from '$lib/components/Select/Select.svelte';
	import { INPUT_SIZES } from '$lib/components/Select/constants.js';
	import { OPTIONS } from './_options.js';
</script>

<ExamplesDecorator>
	{#each Object.values(INPUT_SIZES) as v}
		<Select placement="bottom" label="size {v}" useInPortal items={OPTIONS} size={v} style={{ width: '220px' }} />
	{/each}
</ExamplesDecorator>
