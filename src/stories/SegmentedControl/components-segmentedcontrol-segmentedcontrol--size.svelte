<script lang="ts">
	import Segment from '$lib/components/SegmentedControl/Segment/Segment.svelte';
	import SegmentedControl from '$lib/components/SegmentedControl/SegmentedControl.svelte';
	import { SEGMENTED_CONTROL_SIZES } from '$lib/components/SegmentedControl/constants.js';
	import { OPTIONS } from './_options.js';
</script>

<div style="display: flex; gap: var(--atmr-spacing-3x); flex-direction: column; align-items: flex-start">
	{#each Object.values(SEGMENTED_CONTROL_SIZES) as v}
		<SegmentedControl value="1" size={v}>
			{#each OPTIONS[v] as item, index (item.label ?? index)}
				<Segment label={item.label} disabled={item.disabled} index={index.toString()}>
					{#snippet icon()}{#if item.icon}<item.icon size={item.iconSize} />{/if}{/snippet}
				</Segment>
			{/each}
		</SegmentedControl>
	{/each}
</div>
