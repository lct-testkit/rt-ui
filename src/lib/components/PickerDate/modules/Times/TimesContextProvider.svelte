<script lang="ts">
	// Port of modules/Times/TimesContextProvider.tsx
	import { untrack, type Snippet } from 'svelte';
	import type { ViewContextValue } from '../Picker/context.js';
	import { getFocusedTimesArray, getTimesArray } from './utils.js';

	interface Props {
		interval?: number;
		format: string;
		date: Date;
		activeDate?: Date;
		secondDate?: Date;
		enabledDates?: Date[];
		disabledDates?: Date[];
		minDate?: Date;
		maxDate?: Date;
		isRange?: boolean;
		isOnlyEnabled?: boolean;
		renderFormat?: string;
		children: Snippet<[ViewContextValue]>;
	}

	let { interval: inputInterval, format, date, activeDate, secondDate, enabledDates, disabledDates, minDate, maxDate, isRange, renderFormat, children }: Props = $props();

	const checkInterval = (int: number | undefined) => {
		if (int === 0) {
			return 15;
		}
		return int;
	};

	// React keeps the interval in state and refreshes it in an effect
	const interval = $derived(checkInterval(inputInterval));

	let focusedTimes = $state.raw<string[]>(untrack(() => getFocusedTimesArray(interval, activeDate, secondDate, format, date)));

	$effect(() => {
		focusedTimes = getFocusedTimesArray(interval, activeDate, secondDate, format, date);
	});

	const times = $derived(getTimesArray(date, interval, focusedTimes, format, renderFormat, minDate, maxDate, activeDate, secondDate, enabledDates, disabledDates));

	const handleMouseEnter = (value: Date) => {
		if (isRange && activeDate && !secondDate) {
			if (value > activeDate) {
				focusedTimes = getFocusedTimesArray(interval, activeDate, value, format, date);
			}
		}
	};

	const handleMouseLeave = () => {
		focusedTimes = getFocusedTimesArray(interval, activeDate, secondDate, format, date);
	};

	const value: ViewContextValue = {
		cols: 3,
		get items() {
			return times;
		},
		handleMouseEnter,
		handleMouseLeave
	};
</script>

{@render children(value)}
