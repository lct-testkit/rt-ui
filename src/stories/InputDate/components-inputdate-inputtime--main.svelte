<script lang="ts">
	// Port of stories/InputDate/InputTime
	import InputDate from '$lib/components/InputDate/InputDate.svelte';
	import { CALENDAR_MODE } from '$lib/components/PickerDate/constants.js';
	import TimeStroke from '$lib/icons/24/alert/TimeStroke.svelte';
</script>

{#snippet iconSuffix()}<TimeStroke />{/snippet}

<InputDate isRange calendarMode={CALENDAR_MODE.TIMES_ONLY} dateFormat="HH:mm" placeholder="Выберите время" style={{ width: '280px' }} {iconSuffix} />
