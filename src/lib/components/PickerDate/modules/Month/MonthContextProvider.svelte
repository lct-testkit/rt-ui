<script lang="ts">
	// Port of modules/Month/{useMonthContextProvider.tsx, MonthContextProvider.tsx}
	import { untrack, type Snippet } from 'svelte';
	import type { CalendarItemType } from '../../types.js';
	import type { ViewContextValue } from '../Picker/context.js';
	import { getFocusedMonthsArray, getStatusMonth } from './utils.js';

	interface Props {
		months: string[];
		date: Date;
		activeDate?: Date;
		secondDate?: Date;
		isRange?: boolean;
		minDate?: Date;
		maxDate?: Date;
		children: Snippet<[ViewContextValue]>;
	}

	let { months: monthsNames, date, activeDate, secondDate, isRange, minDate, maxDate, children }: Props = $props();

	let focusedMonths = $state.raw<string[]>(untrack(() => getFocusedMonthsArray(activeDate, secondDate)));

	const months = $derived.by(() => {
		const year = date.getFullYear();
		return monthsNames.map((month, idx): CalendarItemType => {
			const tmpMonth = new Date(year, idx, 1);
			return {
				date: tmpMonth,
				title: month,
				empty: false,
				gradient: undefined,
				status: getStatusMonth(date, tmpMonth, focusedMonths, activeDate, secondDate, minDate, maxDate)
			};
		});
	});

	const handleMouseEnter = (value: Date) => {
		if (isRange) {
			if (activeDate && !secondDate && value > activeDate) {
				focusedMonths = getFocusedMonthsArray(activeDate, value);
			}
		}
	};

	const handleMouseLeave = () => {
		focusedMonths = [];
	};

	const value: ViewContextValue = {
		cols: 3,
		get items() {
			return months;
		},
		handleMouseEnter,
		handleMouseLeave
	};
</script>

{@render children(value)}
