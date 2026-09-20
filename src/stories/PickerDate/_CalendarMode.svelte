<script lang="ts">
	// Port of stories/PickerDate/CalendarMode: every story renders the same layout for one `calendarMode`
	// (a single picker and a range picker, each with the formatted selection above it).
	import './_styles.css';
	import dayjs from 'dayjs';
	import PickerDate from '$lib/components/PickerDate/PickerDate.svelte';
	import type { CalendarMode } from '$lib/components/PickerDate/constants.js';
	import Typography from '$lib/components/Typography/Typography.svelte';

	let { mode, format }: { mode: CalendarMode; format: string } = $props();

	// CalendarMode/utils.ts
	const getRangeDates = (fmt: string, active?: Date, second?: Date): string => {
		const activDate = active ? dayjs(active).format(fmt) : fmt;
		const secondDate = second ? dayjs(second).format(fmt) : fmt;
		return `${activDate} – ${secondDate}`;
	};
	const getDate = (fmt: string, active: Date): string => dayjs(active).format(fmt);

	// `format` never changes for a story
	// svelte-ignore state_referenced_locally
	let date = $state(format);
	// svelte-ignore state_referenced_locally
	let rangeDates = $state(`${format} – ${format}`);
</script>

<div>
	<Typography variant="heading-h2" style={{ marginBottom: 'var(--atmr-spacing-2x)' }}>{mode}</Typography>
	<div class="stories-pickerdate-props-container">
		<div>
			<Typography variant="body-m">{date}</Typography>
			<PickerDate calendarMode={mode} onSelect={(active) => (date = getDate(format, active))} />
		</div>
		<div>
			<Typography variant="body-m">{rangeDates}</Typography>
			<PickerDate calendarMode={mode} isRange onSelect={(active, second) => (rangeDates = getRangeDates(format, active, second))} />
		</div>
	</div>
</div>
