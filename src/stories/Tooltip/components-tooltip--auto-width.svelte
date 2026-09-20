<script lang="ts">
	// Port of stories/Tooltip: AutoWidth
	import './_tooltip-styles.css';
	import Tooltip from '$lib/components/Tooltip/Tooltip.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import InformationMonochrome from '$lib/icons/24/alert/InformationMonochrome.svelte';
</script>

<div class="tooltip-autowidth-row">
	<div class="tooltip-autowidth-item">
		<Typography variant="body-m">autoWidth = false</Typography>
		<Tooltip title="Title" subtitle="Subtitle" size="s" trigger="hover" style={{ width: 'auto' }} variant="primary" autoWidth={false}>
			<InformationMonochrome style="cursor: pointer" />
		</Tooltip>
	</div>
	<div class="tooltip-autowidth-item">
		<Typography variant="body-m">autoWidth = true</Typography>
		<Tooltip title="Title" subtitle="Subtitle" size="s" trigger="hover" style={{ width: 'auto' }} variant="primary" autoWidth={true}>
			<InformationMonochrome style="cursor: pointer" />
		</Tooltip>
	</div>
</div>
