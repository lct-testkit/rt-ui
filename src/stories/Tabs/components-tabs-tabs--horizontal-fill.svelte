<script lang="ts">
	// Port of stories/Tabs HorizontalFill: args { horizontalFill: false, value: '0' }, decorator = 500px flex row
	import RenderTabs from './_RenderTabs.svelte';
</script>

<div style="display: flex; align-items: center; width: 500px">
	<RenderTabs tabsProps={{ value: '0', horizontalFill: false }} />
</div>
