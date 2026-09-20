<script lang="ts">
	// Port of stories/Popover/Metrics
	import './_decorator.css';
	import './_common.css';
	import './_metrics.css';
	import Popover from '$lib/components/Popover/Popover.svelte';
	import FunctionButton from '$lib/components/Button/FunctionButton/FunctionButton.svelte';
	import InformationColor from '$lib/icons/24/alert/InformationColor.svelte';
</script>

<Popover
	title="Метрики"
	subtitle="Числовые показатели работы системы: загрузка CPU, объём памяти, частота ошибок, количество запросов"
	showCloseButton={true}
	popoverClassName="stories-metrics-popover"
>
	{#snippet body()}<FunctionButton label="Подробнее" class="stories-popover-link-button" />{/snippet}
	<InformationColor class="trigger" />
</Popover>
