<script lang="ts">
	// Port of stories/TabsItem IconPosition, decorator `examplesDecorator`: one item per TABS_ICON_POSITIONS value
	import { TABS_ICON_POSITIONS } from '$lib/components/Tabs/constants.js';
	import TabsItem from '$lib/components/Tabs/TabsItem/TabsItem.svelte';
	import Internet from '$lib/icons/24/technology/Internet.svelte';
	import ExamplesDecorator from '../_utils/ExamplesDecorator.svelte';
</script>

<ExamplesDecorator>
	{#each Object.values(TABS_ICON_POSITIONS) as v}
		<TabsItem iconPosition={v} label="Icon {v}" tabindex={-1} style={{ width: '140px' }}>
			{#snippet icon()}<Internet />{/snippet}
		</TabsItem>
	{/each}
</ExamplesDecorator>
