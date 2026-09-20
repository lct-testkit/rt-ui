<script lang="ts">
	// Port of stories/TabsItem Size, decorator `examplesDecorator`
	import TabsItem from '$lib/components/Tabs/TabsItem/TabsItem.svelte';
	import Internet16 from '$lib/icons/16/technology/Internet16.svelte';
	import Internet from '$lib/icons/24/technology/Internet.svelte';
	import ExamplesDecorator from '../_utils/ExamplesDecorator.svelte';
</script>

<ExamplesDecorator>
	<TabsItem label="Size m" size="m" tabindex={-1} style={{ width: '140px' }}>
		{#snippet icon()}<Internet />{/snippet}
	</TabsItem>
	<TabsItem label="Size s" size="s" tabindex={0}>
		{#snippet icon()}<Internet16 />{/snippet}
	</TabsItem>
</ExamplesDecorator>
