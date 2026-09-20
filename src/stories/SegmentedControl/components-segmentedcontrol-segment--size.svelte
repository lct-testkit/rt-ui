<script lang="ts">
	import Segment from '$lib/components/SegmentedControl/Segment/Segment.svelte';
	import { SEGMENTED_CONTROL_SIZES } from '$lib/components/SegmentedControl/constants.js';
	import ExamplesDecorator from '../_utils/ExamplesDecorator.svelte';
</script>

<ExamplesDecorator>
	{#each Object.values(SEGMENTED_CONTROL_SIZES) as v}
		<Segment size={v} label={`Size ${v}`} variant="primary" />
	{/each}
</ExamplesDecorator>
