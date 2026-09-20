<script lang="ts">
	// Port of stories/InputDate/CalendarMode (decorators: examplesDecorator)
	import './_styles.css';
	import InputDate from '$lib/components/InputDate/InputDate.svelte';
	import { CALENDAR_MODE } from '$lib/components/PickerDate/constants.js';
	import ExamplesDecorator from '../_utils/ExamplesDecorator.svelte';
	import { CALENDAR_MODE_TO_DATE_FORMAT } from './_constants.js';
</script>

<ExamplesDecorator>
	<div class="stories-inputDate-calendarMode">
		{#each Object.values(CALENDAR_MODE) as v (v)}
			<InputDate calendarMode={v} dateFormat={CALENDAR_MODE_TO_DATE_FORMAT[v]} label={`mode ${v}`} hintPrefix={CALENDAR_MODE_TO_DATE_FORMAT[v]} />
		{/each}
	</div>
</ExamplesDecorator>
