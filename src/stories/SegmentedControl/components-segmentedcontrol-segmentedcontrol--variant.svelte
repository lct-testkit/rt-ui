<script lang="ts">
	import Segment from '$lib/components/SegmentedControl/Segment/Segment.svelte';
	import SegmentedControl from '$lib/components/SegmentedControl/SegmentedControl.svelte';
	import { SEGMENTED_CONTROL_VARIANTS } from '$lib/components/SegmentedControl/constants.js';
	import ExamplesDecorator from '../_utils/ExamplesDecorator.svelte';
	import { OPTIONS } from './_options.js';
</script>

<ExamplesDecorator>
	{#each Object.values(SEGMENTED_CONTROL_VARIANTS) as v}
		<SegmentedControl value="1" variant={v}>
			{#each OPTIONS.l as item, index (item.label ?? index)}
				<Segment label={item.label} disabled={item.disabled} index={index.toString()}>
					{#snippet icon()}{#if item.icon}<item.icon size={item.iconSize} />{/if}{/snippet}
				</Segment>
			{/each}
		</SegmentedControl>
	{/each}
</ExamplesDecorator>
