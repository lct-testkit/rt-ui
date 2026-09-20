<script lang="ts">
	// Port of `renderTabs(tabsProps, itemProps)` of Tabs.stories.tsx: a TabsGroup with four items (Internet / Interactive TV / Mobile / Other)
	// and its OWN `val` state ('0') - every call of renderTabs has its own useState.
	import TabsGroup, { type TabsGroupProps } from '$lib/components/Tabs/TabsGroup/TabsGroup.svelte';
	import TabsItem, { type TabsItemProps } from '$lib/components/Tabs/TabsItem/TabsItem.svelte';
	import Promocode from '$lib/icons/24/business/Promocode.svelte';
	import Desktop from '$lib/icons/24/technology/Desktop.svelte';
	import Internet from '$lib/icons/24/technology/Internet.svelte';
	import Mobile from '$lib/icons/24/technology/Mobile.svelte';

	let { tabsProps = {}, itemProps = {} }: { tabsProps?: Partial<TabsGroupProps>; itemProps?: Partial<TabsItemProps> } = $props();

	let val = $state('0');
</script>

<TabsGroup
	{...tabsProps}
	value={val}
	onChange={(result) => {
		val = result;
	}}
>
	<TabsItem label="Интернет" index="0" {...itemProps}>
		{#snippet icon()}<Internet />{/snippet}
	</TabsItem>
	<TabsItem label="Интерактивное ТВ" index="1" {...itemProps}>
		{#snippet icon()}<Desktop />{/snippet}
	</TabsItem>
	<TabsItem label="Мобильный телефон" index="2" {...itemProps}>
		{#snippet icon()}<Mobile />{/snippet}
	</TabsItem>
	<TabsItem label="Прочее" index="3" {...itemProps}>
		{#snippet icon()}<Promocode />{/snippet}
	</TabsItem>
</TabsGroup>
