<script lang="ts">
	// Port of stories/Tooltip: Controlled
	import './_tooltip-styles.css';
	import Tooltip from '$lib/components/Tooltip/Tooltip.svelte';
	import Button from '$lib/components/Button/Button/Button.svelte';
	import InformationMonochrome from '$lib/icons/24/alert/InformationMonochrome.svelte';

	let open = $state(false);
</script>

<div style="display: flex; align-items: center; flex-direction: column; gap: 16px">
	<Tooltip
		title="Заголовок"
		subtitle="Текст внутри тултипа"
		size="s"
		variant="primary"
		placement="top"
		isOpened={open}
		onOpen={() => (open = true)}
		onClose={() => (open = false)}
		useInPortal={true}
		trigger="hover"
		style={{ width: '24px' }}
	>
		<InformationMonochrome data-testid="controlled-tooltip" />
	</Tooltip>
	<Button label={open ? 'Скрыть тултип' : 'Показать тултип'} onclick={() => (open = !open)} />
</div>
