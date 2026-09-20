<script lang="ts">
	// Port of stories/InputDate: Main ("InputDate")
	import './_styles.css';
	import InputDate from '$lib/components/InputDate/InputDate.svelte';
	import DecorateStory from '../_utils/DecorateStory.svelte';
	import { DAYS_OF_WEEK, DisabledDatesExample, EnabledDatesExample, MONTHS } from './_constants.js';
</script>

<div style="min-width: 280px">
	<DecorateStory>
		<InputDate
			size="m"
			variant="primary"
			label="Label"
			useInPortal
			disabledDates={DisabledDatesExample}
			enabledDates={EnabledDatesExample}
			months={MONTHS}
			daysOfWeek={DAYS_OF_WEEK}
		/>
	</DecorateStory>
</div>
