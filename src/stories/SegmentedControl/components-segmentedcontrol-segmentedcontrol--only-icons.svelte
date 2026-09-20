<script lang="ts">
	import Segment from '$lib/components/SegmentedControl/Segment/Segment.svelte';
	import SegmentedControl from '$lib/components/SegmentedControl/SegmentedControl.svelte';
	import { OPTIONS_ICONS } from './_options.js';
</script>

<SegmentedControl value="1">
	{#each OPTIONS_ICONS.l as item, index (item.label ?? index)}
		<Segment label={item.label} disabled={item.disabled} index={index.toString()}>
			{#snippet icon()}{#if item.icon}<item.icon size={item.iconSize} />{/if}{/snippet}
		</Segment>
	{/each}
</SegmentedControl>
