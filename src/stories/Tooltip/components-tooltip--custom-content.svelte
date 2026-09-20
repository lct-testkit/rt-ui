<script lang="ts">
	// Port of stories/Tooltip: CustomContent
	import './_tooltip-styles.css';
	import Tooltip from '$lib/components/Tooltip/Tooltip.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import Badge from '$lib/components/Badge/Badge.svelte';
	import InformationMonochrome from '$lib/icons/24/alert/InformationMonochrome.svelte';
</script>

<Tooltip
	title="Заголовок"
	subtitle="Текст внутри тултипа"
	size="s"
	trigger="hover"
	style={{ width: 'auto' }}
	variant="primary"
	placement="right"
	pointerIsCentered={false}
	tooltipClassName="tooltip-custom-content-story"
	autoWidth={false}
>
	{#snippet innerChildren()}
		<div class="tooltip-custom-content">
			<div class="tooltip-custom-content-header">
				<Typography variant="body-s" strong>Команда KOD</Typography>
				<Badge size="2xs" variant="secondary" colorScheme="status-01" label="РТК ИТ" />
			</div>
			<Typography variant="description-s" class="tooltip-custom-content-description">Направление диджитал</Typography>
		</div>
	{/snippet}
	<InformationMonochrome style="cursor: pointer" />
</Tooltip>
