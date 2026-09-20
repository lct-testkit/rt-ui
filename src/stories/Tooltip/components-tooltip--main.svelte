<script lang="ts">
	// Port of stories/Tooltip: Main
	import './_tooltip-styles.css';
	import Tooltip from '$lib/components/Tooltip/Tooltip.svelte';
	import InformationMonochrome from '$lib/icons/24/alert/InformationMonochrome.svelte';
</script>

<Tooltip title="Заголовок" subtitle="Текст внутри тултипа" size="s" trigger="hover" style={{ width: 'auto' }} variant="primary">
	<InformationMonochrome style="cursor: pointer" data-testid="hover" />
</Tooltip>
