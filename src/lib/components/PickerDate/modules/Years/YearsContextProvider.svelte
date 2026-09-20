<script lang="ts">
	// Port of modules/Years/{useYearsContextProvider.tsx, YearsContextProvider.tsx}
	import { untrack, type Snippet } from 'svelte';
	import type { CalendarItemType } from '../../types.js';
	import type { ViewContextValue } from '../Picker/context.js';
	import { getFocusedYearsArray, getStatusYears } from './utils.js';

	interface Props {
		minYear: number;
		maxYear: number;
		minDate?: Date;
		maxDate?: Date;
		date: Date;
		activeDate?: Date;
		secondDate?: Date;
		isRange?: boolean;
		children: Snippet<[ViewContextValue]>;
	}

	let { minYear: inputMinYear, maxYear: inputMaxYear, minDate, maxDate, date, activeDate, secondDate, isRange, children }: Props = $props();

	// React keeps minYear / maxYear in state and normalises them in an effect (swap / +1 when equal)
	const minYear = $derived(inputMinYear > inputMaxYear ? inputMaxYear : inputMinYear);
	const maxYear = $derived(inputMinYear > inputMaxYear ? inputMinYear : inputMinYear === inputMaxYear ? inputMaxYear + 1 : inputMaxYear);

	let focusedYears = $state.raw<number[]>(untrack(() => getFocusedYearsArray(activeDate, secondDate)));

	const years = $derived.by(() => {
		const y: CalendarItemType[] = [];
		for (let i = minYear; i <= maxYear; i += 1) {
			y.push({
				date: new Date(i, 0, 1),
				title: String(i),
				empty: undefined,
				gradient: undefined,
				status: getStatusYears(date, i, activeDate, secondDate, focusedYears, minDate, maxDate)
			});
		}
		return y;
	});

	const handleMouseEnter = (value: Date) => {
		if (isRange) {
			if (activeDate && !secondDate && value > activeDate) {
				focusedYears = getFocusedYearsArray(activeDate, value);
			}
		}
	};

	const handleMouseLeave = () => {
		focusedYears = [];
	};

	const value: ViewContextValue = {
		cols: 3,
		get items() {
			return years;
		},
		handleMouseEnter,
		handleMouseLeave
	};
</script>

{@render children(value)}
