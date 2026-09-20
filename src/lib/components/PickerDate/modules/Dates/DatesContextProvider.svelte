<script lang="ts">
	// Port of modules/Dates/{useDatesContextProvider.tsx, DatesContextProvider.tsx}
	import { untrack, type Snippet } from 'svelte';
	import type { ViewContextValue } from '../Picker/context.js';
	import { getDates, getFocusedDatesArray } from './utils.js';

	interface Props {
		date: Date;
		activeDate?: Date;
		secondDate?: Date;
		disabledDates?: Date[];
		enabledDates?: Date[];
		minDate?: Date;
		maxDate?: Date;
		isRange?: boolean;
		isOnlyEnabled?: boolean;
		children: Snippet<[ViewContextValue]>;
	}

	let { date, activeDate, secondDate, disabledDates = [], enabledDates = [], minDate, maxDate, isRange, isOnlyEnabled, children }: Props = $props();

	let focusedDates = $state.raw<string[]>(untrack(() => getFocusedDatesArray(activeDate, secondDate, date)));

	$effect(() => {
		focusedDates = getFocusedDatesArray(activeDate, secondDate, date);
	});

	const dates = $derived(
		getDates(date, {
			firstDayIndex: 1,
			minDate,
			maxDate,
			focusedDates,
			disabledDates,
			enabledDates,
			isOnlyEnabled
		})
	);

	const handleMouseEnter = (value: Date) => {
		if (isRange && activeDate && !secondDate && date) {
			if (value > activeDate) {
				focusedDates = getFocusedDatesArray(activeDate, value, date);
			}
		}
	};

	const handleMouseLeave = () => {
		focusedDates = getFocusedDatesArray(activeDate, secondDate, date);
	};

	const value: ViewContextValue = {
		cols: 7,
		get items() {
			return dates;
		},
		handleMouseEnter,
		handleMouseLeave
	};
</script>

{@render children(value)}
