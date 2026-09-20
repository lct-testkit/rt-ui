<script lang="ts">
	// Port of stories/InputDate/DateFormat
	import InputDate from '$lib/components/InputDate/InputDate.svelte';
	import { DAYS_OF_WEEK, MONTHS } from './_constants.js';
</script>

<InputDate dateFormat="YYYY.MM.DD" style={{ width: '280px' }} months={MONTHS} daysOfWeek={DAYS_OF_WEEK} />
