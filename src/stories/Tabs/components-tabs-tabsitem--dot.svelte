<script lang="ts">
	// Port of stories/TabsItem Dot, decorator `examplesDecorator`: args { dot: true }
	import TabsItem from '$lib/components/Tabs/TabsItem/TabsItem.svelte';
	import Internet from '$lib/icons/24/technology/Internet.svelte';
	import ExamplesDecorator from '../_utils/ExamplesDecorator.svelte';
</script>

<ExamplesDecorator>
	<TabsItem dot label="Интернет" tabindex={-1} style={{ maxWidth: '150px' }}>
		{#snippet icon()}<Internet />{/snippet}
	</TabsItem>
</ExamplesDecorator>
