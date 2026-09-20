<script lang="ts">
	// Port of stories/PickerDate/Props: CallBackFunctions
	import dayjs from 'dayjs';
	import PickerDate from '$lib/components/PickerDate/PickerDate.svelte';
	import { MONTHS } from '$lib/components/PickerDate/constants.js';
	import Typography from '$lib/components/Typography/Typography.svelte';

	let month = $state(new Date().getMonth());
	let year = $state(new Date().getFullYear());
	let activeDate = $state.raw<Date | undefined>(new Date('03.07.2023'));
	let secondDate = $state.raw<Date | undefined>(new Date('03.20.2023'));
</script>

<div>
	<Typography variant="heading-h2" style={{ marginBottom: 'var(--atmr-spacing-2x)' }}>CallBack Functions</Typography>
	<div style="display: flex; gap: 40px">
		<div>
			<Typography variant="body-m">{`onChangeMonth: ${MONTHS[month]}`}</Typography>
			<PickerDate onChangeMonth={(m) => (month = m)} />
		</div>
		<div>
			<Typography variant="body-m">{`onChangeYear: ${year}`}</Typography>
			<PickerDate onChangeYear={(y) => (year = y)} />
		</div>
		<div>
			<Typography variant="body-m">
				{`onSelect: ${activeDate ? dayjs(activeDate).format('DD.MM.YYYY') : '...'} - ${secondDate ? dayjs(secondDate).format('DD.MM.YYYY') : '...'}`}
			</Typography>
			<PickerDate
				{activeDate}
				{secondDate}
				isRange
				onSelect={(a, b) => {
					activeDate = a;
					secondDate = b;
				}}
			/>
		</div>
	</div>
</div>
