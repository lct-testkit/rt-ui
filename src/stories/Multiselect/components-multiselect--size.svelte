<script lang="ts">
	// Port of stories/Multiselect Size, decorator `examplesDecorator` (a Multiselect per `INPUT_SIZES` value)
	import ExamplesDecorator from '../_utils/ExamplesDecorator.svelte';
	import Multiselect from '$lib/components/Multiselect/Multiselect.svelte';
	import { INPUT_SIZES } from '$lib/components/Input/constants.js';
	import { OPTIONS } from '../Select/_options.js';
</script>

<ExamplesDecorator>
	{#each Object.values(INPUT_SIZES) as v}
		<Multiselect useInPortal autocomplete={{ enabled: true }} items={OPTIONS} size={v} label="size {v}" style={{ width: '280px' }} />
	{/each}
</ExamplesDecorator>
