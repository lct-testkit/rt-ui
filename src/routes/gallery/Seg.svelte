<script lang="ts" generics="T extends string | number">
	// Thin helper over rt-ui SegmentedControl: options as [value, label] pairs, controlled value.
	import SegmentedControl from '$lib/components/SegmentedControl/SegmentedControl.svelte';
	import Segment from '$lib/components/SegmentedControl/Segment/Segment.svelte';

	let { options, value, onChange, size = 's' }: { options: [T, string][]; value: T; onChange: (v: T) => void; size?: 's' | 'm' | 'l' } = $props();
</script>

<SegmentedControl {size} value={String(value)} onChange={(i: string) => onChange(options.find(([v]) => String(v) === i)![0])}>
	{#each options as [v, label] (v)}
		<Segment index={String(v)} {label} />
	{/each}
</SegmentedControl>
