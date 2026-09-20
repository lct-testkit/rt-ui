<script lang="ts">
	// Port of stories/Tabs MaxVisibleTabs: args { maxVisibleTabs: 5, style: { maxWidth: 'fit-content' }, value: '0' }, 8 tabs "Label"
	import TabsGroup from '$lib/components/Tabs/TabsGroup/TabsGroup.svelte';
	import TabsItem from '$lib/components/Tabs/TabsItem/TabsItem.svelte';

	let val = $state('0');
</script>

<TabsGroup
	style={{ maxWidth: 'fit-content' }}
	value={val}
	maxVisibleTabs={5}
	onChange={(result) => {
		val = result;
	}}
>
	{#each Array.from({ length: 8 }, (_, i) => i) as i (i)}
		<TabsItem index={String(i)} label="Label" />
	{/each}
</TabsGroup>
