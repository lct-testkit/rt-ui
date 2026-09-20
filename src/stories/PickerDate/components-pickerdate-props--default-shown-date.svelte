<script lang="ts">
	// Port of stories/PickerDate/Props: DefaultShownDate
	import './_styles.css';
	import PickerDate from '$lib/components/PickerDate/PickerDate.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';

	const shown1 = new Date('01.01.2022');
	const shown2 = new Date('05.01.2024');
</script>

<div class="stories-pickerdate-props-container">
	<div>
		<Typography variant="body-m"
			>activeDate: undefined,<br />secondDate: undefined,<br /> isRange: false<br />defaultShownDate: 01.01.2022,<br /></Typography
		>
		<PickerDate defaultShownDate={shown1} />
	</div>
	<div>
		<Typography variant="body-m"
			>activeDate: undefined,<br />secondDate: undefined,<br /> isRange: false<br />defaultShownDate: 01.05.2024,<br /></Typography
		>
		<PickerDate defaultShownDate={shown2} />
	</div>
</div>
