<script lang="ts">
	// Port of stories/PickerDate/Props: EnabledDates
	import './_styles.css';
	import PickerDate from '$lib/components/PickerDate/PickerDate.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import { DisabledDatesExample, EnabledDatesExample } from './_constants.js';

	const activeDate1 = new Date('07.11.2023');
	const activeDate2 = new Date('07.04.2023');
	const minDate = new Date('03.04.2023');
	const maxDate = new Date('07.07.2023');
</script>

<div class="stories-pickerdate-props-container">
	<div>
		<Typography variant="body-m">enabledDates + disabledDates</Typography>
		<PickerDate activeDate={activeDate1} disabledDates={DisabledDatesExample} enabledDates={EnabledDatesExample} />
	</div>
	<div>
		<Typography variant="body-m">enabledDates + max/minDatex</Typography>
		<PickerDate activeDate={activeDate2} enabledDates={EnabledDatesExample} {minDate} {maxDate} />
	</div>
</div>
