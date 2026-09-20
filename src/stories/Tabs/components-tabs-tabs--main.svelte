<script lang="ts">
	// Port of stories/Tabs Main ("Tabs"): args { variant: 'primary', size: 'm', value: '0' }, the story keeps `val` in useState
	import TabsGroup from '$lib/components/Tabs/TabsGroup/TabsGroup.svelte';
	import TabsItem from '$lib/components/Tabs/TabsItem/TabsItem.svelte';
	import TabsPanel from '$lib/components/Tabs/TabsPanel/TabsPanel.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import Promocode from '$lib/icons/24/business/Promocode.svelte';
	import Desktop from '$lib/icons/24/technology/Desktop.svelte';
	import Internet from '$lib/icons/24/technology/Internet.svelte';
	import Mobile from '$lib/icons/24/technology/Mobile.svelte';

	const options = [
		{ label: 'Интернет', icon: Internet },
		{ label: 'Интерактивное ТВ', icon: Desktop, dot: true },
		{ label: 'Мобильный телефон', icon: Mobile },
		{ label: 'Прочее', icon: Promocode, disabled: true }
	];

	let val = $state('0');
	const onChange = (result: string) => {
		val = result;
	};
</script>

<TabsGroup variant="primary" size="m" value={val} {onChange}>
	{#each options as item, index (item.label)}
		<TabsItem label={item.label} dot={item.dot} disabled={item.disabled} index={index.toString()}>
			{#snippet icon()}<item.icon />{/snippet}
		</TabsItem>
	{/each}
</TabsGroup>
<TabsPanel value={val} index="0"><Typography variant="body-m">Content One</Typography></TabsPanel>
<TabsPanel value={val} index="1"><Typography variant="body-m">Content Two</Typography></TabsPanel>
<TabsPanel value={val} index="2"><Typography variant="body-m">Content Three</Typography></TabsPanel>
<TabsPanel value={val} index="3"><Typography variant="body-m">Content Four</Typography></TabsPanel>
