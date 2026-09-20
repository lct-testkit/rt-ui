<script lang="ts">
	// Port of stories/PickerDate/Props: DisabledMonthWithTooltip
	import './_styles.css';
	import PickerDate from '$lib/components/PickerDate/PickerDate.svelte';
	import type { CalendarView } from '$lib/components/PickerDate/constants.js';
	import type { CalendarItemType } from '$lib/components/PickerDate/types.js';
	import Tooltip from '$lib/components/Tooltip/Tooltip.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';

	const activeDate = new Date('03.07.2023');
	const minDate = new Date('03.04.2023');
	const maxDate = new Date('05.24.2023');
	const secondDate = new Date('05.07.2023');
</script>

{#snippet renderDate(item: CalendarItemType, view: CalendarView)}{#if view === 'month' && item.status === 'disabled'}<Tooltip title={item.title} placement="top" trigger="hover">{item.title}</Tooltip>{:else}{item.title}{/if}{/snippet}

<div class="stories-pickerdate-props-container">
	<div>
		<Typography variant="body-m">minDate: 03.04.2023,<br />maxDate: 05.24.2023,</Typography>
		<PickerDate {activeDate} {minDate} {maxDate} {renderDate} />
	</div>
	<div>
		<Typography variant="body-m">minDate: 03.04.2023,<br />maxDate: 05.24.2023,</Typography>
		<PickerDate {activeDate} {minDate} {secondDate} {maxDate} isRange {renderDate} />
	</div>
</div>
