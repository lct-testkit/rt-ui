<script lang="ts">
	// Port of stories/InputDate/Autocomplete
	import './_styles.css';
	import Button from '$lib/components/Button/Button/Button.svelte';
	import InputDate from '$lib/components/InputDate/InputDate.svelte';
	import { DAYS_OF_WEEK, MONTHS } from './_constants.js';
</script>

<form class="stories-input-form" method="dialog">
	<div>
		<InputDate style={{ width: '280px' }} required name="bday" autocomplete="bday" months={MONTHS} daysOfWeek={DAYS_OF_WEEK} />
	</div>
	<Button type="submit" label="Submit" />
</form>
