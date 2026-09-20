<script lang="ts">
	// Port of stories/PickerDate/Props: ForceEnabledDates
	import './_styles.css';
	import PickerDate from '$lib/components/PickerDate/PickerDate.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';

	const description = 'Проп isOnlyEnabled необходимо использовать в связке c enabledDates. Проп принудительно делает доступными даты только из массива enabledDates, все остальные даты переходят в состояние disable.';
	const tomorrow = new Date();
	tomorrow.setDate(tomorrow.getDate() + 1);
	const enabledDatesExample = [new Date(), tomorrow];
</script>

<Typography variant="heading-h2" style={{ marginBottom: 'var(--atmr-spacing-2x)' }}>isOnlyEnabled</Typography>
<div class="stories-pickerdate-props-container">
	<div>
		<Typography variant="body-m">{description}</Typography>
		<PickerDate enabledDates={enabledDatesExample} isOnlyEnabled />
	</div>
</div>
