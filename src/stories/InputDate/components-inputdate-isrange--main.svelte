<script lang="ts">
	// Port of stories/InputDate/IsRange
	import InputDate from '$lib/components/InputDate/InputDate.svelte';
	import { DAYS_OF_WEEK, MONTHS } from './_constants.js';
</script>

<InputDate isRange style={{ width: '280px' }} months={MONTHS} daysOfWeek={DAYS_OF_WEEK} />
