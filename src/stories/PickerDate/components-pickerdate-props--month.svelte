<script lang="ts">
	// Port of stories/PickerDate/Props: Month
	import './_styles.css';
	import PickerDate from '$lib/components/PickerDate/PickerDate.svelte';
	import { CALENDAR_MODE } from '$lib/components/PickerDate/constants.js';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import { MonthDe, MonthEng } from './_constants.js';
</script>

<Typography variant="heading-h2" style={{ marginBottom: 'var(--atmr-spacing-2x)' }}>Названия месяцев</Typography>
<div class="stories-pickerdate-props-container">
	<div>
		<Typography variant="body-m">На русском</Typography>
		<PickerDate calendarMode={CALENDAR_MODE.MONTHS_ONLY} />
	</div>
	<div>
		<Typography variant="body-m">На немецком</Typography>
		<PickerDate months={MonthDe} calendarMode={CALENDAR_MODE.MONTHS_ONLY} />
	</div>
	<div>
		<Typography variant="body-m">На английском</Typography>
		<PickerDate months={MonthEng} calendarMode={CALENDAR_MODE.MONTHS_ONLY} />
	</div>
</div>
