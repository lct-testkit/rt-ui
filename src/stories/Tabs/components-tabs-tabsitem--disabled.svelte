<script lang="ts">
	// Port of stories/TabsItem Disabled: args { label: 'Интернет', icon: 'internet', iconPosition: 'left', size: 'm', disabled: true }
	import TabsItem from '$lib/components/Tabs/TabsItem/TabsItem.svelte';
	import Internet from '$lib/icons/24/technology/Internet.svelte';
</script>

<TabsItem label="Интернет" iconPosition="left" size="m" disabled>
	{#snippet icon()}<Internet />{/snippet}
</TabsItem>
