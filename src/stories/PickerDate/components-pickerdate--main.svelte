<script lang="ts">
	// Port of stories/PickerDate: Main ("Picker Date")
	import './_styles.css';
	import dayjs from 'dayjs';
	import PickerDate from '$lib/components/PickerDate/PickerDate.svelte';
	import { DAYS_OF_WEEK, MONTHS } from '$lib/components/PickerDate/constants.js';
	import Typography from '$lib/components/Typography/Typography.svelte';

	// initialArgs of the story: only `daysOfWeek` / `months` (+ action spies); `isRange`, the dates and the chevrons are undefined
	const isRange: boolean | undefined = undefined;
	const DEFAULT_DATE_FORMAT = 'DD.MM.YYYY HH:mm';

	let activeD = $state.raw<Date | undefined>(undefined);
	let secondD = $state.raw<Date | undefined>(undefined);
</script>

<div class="stories-pickerdate-container">
	{#if activeD}
		<Typography variant="body-l">{`${dayjs(activeD).format(DEFAULT_DATE_FORMAT)} ${isRange ? '-' : ''}`}</Typography>
	{/if}
	{#if secondD && isRange}
		&nbsp;
		<Typography variant="body-l">{`${dayjs(secondD).format(DEFAULT_DATE_FORMAT)}`}</Typography>
	{/if}
</div>
<PickerDate
	daysOfWeek={DAYS_OF_WEEK}
	months={MONTHS}
	activeDate={activeD}
	secondDate={secondD}
	onSelect={(active, second) => {
		activeD = active;
		secondD = second;
	}}
/>
