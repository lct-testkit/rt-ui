<script lang="ts">
	import Segment from '$lib/components/SegmentedControl/Segment/Segment.svelte';
	import { SEGMENTED_CONTROL_VARIANTS } from '$lib/components/SegmentedControl/constants.js';
	import ExamplesDecorator from '../_utils/ExamplesDecorator.svelte';
</script>

<ExamplesDecorator>
	{#each Object.values(SEGMENTED_CONTROL_VARIANTS) as v}
		<Segment size="m" variant={v} label={v} />
	{/each}
</ExamplesDecorator>
