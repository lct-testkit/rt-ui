<script lang="ts">
	// Port of stories/PickerDate/Props: ActiveSecondDate
	import './_styles.css';
	import dayjs from 'dayjs';
	import PickerDate from '$lib/components/PickerDate/PickerDate.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import T from './_T.svelte';

	const DEFAULT_DATE_FORMAT = 'MM.DD.YYYY';
	let activeD1 = $state.raw<Date | undefined>(new Date('03.07.2023'));
	let secondD1 = $state.raw<Date | undefined>(new Date('05.08.2023'));
	let activeD2 = $state.raw<Date | undefined>(new Date('03.07.2023'));
	let secondD2 = $state.raw<Date | undefined>(new Date('05.08.2023'));
</script>

<div class="stories-pickerdate-props-container">
	<div>
		<Typography variant="body-m"
			><T text="activeDate: " /><T text={dayjs(activeD1).format(DEFAULT_DATE_FORMAT)} /><T text="," /><br /><T text="secondDate: " /><T text={dayjs(secondD1).format(DEFAULT_DATE_FORMAT)} /><T text="," /><br /> isRange: undefined</Typography
		>
		<PickerDate activeDate={activeD1} secondDate={secondD1}
			onSelect={(active, second) => {
					activeD1 = active;
					if (second) {
						secondD1 = second;
					}
				}}
		/>
	</div>
	<div>
		<Typography variant="body-m"
			><T text="activeDate: " /><T text={dayjs(activeD2).format(DEFAULT_DATE_FORMAT)} /><T text="," /><br /><T text="secondDate: " /><T text={dayjs(secondD2).format(DEFAULT_DATE_FORMAT)} /><T text="," /><br /> isRange: true</Typography
		>
		<PickerDate isRange activeDate={activeD2} secondDate={secondD2}
			onSelect={(active, second) => {
					activeD2 = active;
					secondD2 = second;
				}}
		/>
	</div>
</div>
