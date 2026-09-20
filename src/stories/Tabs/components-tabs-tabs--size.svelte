<script lang="ts">
	// Port of stories/Tabs Size: one group per TABS_SIZES value, decorator = column flex
	import { TABS_SIZES } from '$lib/components/Tabs/constants.js';
	import RenderTabs from './_RenderTabs.svelte';
</script>

<div style="display: flex; gap: var(--atmr-spacing-5x); flex-direction: column; align-items: flex-start">
	{#each Object.values(TABS_SIZES) as v}
		<RenderTabs tabsProps={{ size: v }} />
	{/each}
</div>
