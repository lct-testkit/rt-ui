<script lang="ts">
	// Port of stories/Tabs VerticalFill: args { verticalFill: true, value: '0' }, style 100% x 100%, decorator = 130px dashed box
	import RenderTabs from './_RenderTabs.svelte';
</script>

<div style="height: 130px; border: 1px dashed var(--atmr-border-muted)">
	<RenderTabs tabsProps={{ value: '0', verticalFill: true, style: { height: '100%', width: '100%' } }} />
</div>
