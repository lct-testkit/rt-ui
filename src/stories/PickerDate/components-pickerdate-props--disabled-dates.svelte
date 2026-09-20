<script lang="ts">
	// Port of stories/PickerDate/Props: DisabledDates
	import PickerDate from '$lib/components/PickerDate/PickerDate.svelte';
	import { DisabledDatesExample } from './_constants.js';

	const activeDate = new Date('07.11.2023');
</script>

<PickerDate {activeDate} disabledDates={DisabledDatesExample} isRange />
