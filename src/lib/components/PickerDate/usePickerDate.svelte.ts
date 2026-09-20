// Port of packages/ui-kit/src/components/PickerDate/usePickerDate.tsx
//
// React keeps everything in `useState`; here the same state lives in `$state.raw` (Dates are compared by identity, exactly like
// React's `Object.is` for state / effect deps) and the `useEffect`s with a dependency list become `$effect`s that read ONLY the
// props React lists as dependencies (everything else is read inside `untrack`).
import dayjs from 'dayjs';
import { untrack } from 'svelte';
import { CALENDAR_MODE, CALENDAR_VIEW, type CalendarMode, type CalendarView } from './constants.js';
import type { TimeProps } from './types.js';
import {
	DClickMode,
	DTClickMode,
	getMinutesFromInterval,
	getView,
	MClickMode,
	MDClickMode,
	MDTClickMode,
	TClickMode,
	YClickMode,
	YMClickMode,
	YMDClickMode,
	YMDTClickMode,
	type ClickModeConfig
} from './utils.js';

export interface UsePickerDateProps {
	readonly activeDate?: Date;
	readonly secondDate?: Date;
	readonly isRange?: boolean;
	readonly onSelect?: (activeDate: Date, secondDate?: Date) => void;
	readonly showTime?: boolean;
	readonly timeProps?: TimeProps;
	readonly onChangeMonth?: (month: number) => void;
	readonly onChangeYear?: (year: number) => void;
	readonly calendarMode: CalendarMode;
	readonly defaultShownDate?: Date;
}

/** `props` must be an object with getters (or the `$props()` proxy) so that every read is reactive. */
export const usePickerDate = (props: UsePickerDateProps) => {
	let view = $state.raw<CalendarView>(untrack(() => getView(props.calendarMode, props.showTime)));

	// useEffect(() => setView(getView(calendarMode, showTime)), [calendarMode, showTime])
	$effect(() => {
		const next = getView(props.calendarMode, props.showTime);
		untrack(() => {
			view = next;
		});
	});

	// useMemo(..., [view, timeProps?.interval])
	const today = $derived.by((): Date => {
		const currentView = view;
		const interval = props.timeProps?.interval;
		const tmpToday = dayjs().toDate();
		switch (currentView) {
			case CALENDAR_VIEW.day:
				return tmpToday;
			case CALENDAR_VIEW.month:
				return new Date(tmpToday.getFullYear(), tmpToday.getMonth(), 1);
			case CALENDAR_VIEW.year:
				return new Date(tmpToday.getFullYear(), 0, 1);
			case CALENDAR_VIEW.time:
				return new Date(tmpToday.getFullYear(), tmpToday.getMonth(), tmpToday.getDate(), tmpToday.getHours(), interval ? getMinutesFromInterval(interval, tmpToday.getMinutes()) : 0);
			default:
				return tmpToday;
		}
	});

	let date = $state.raw<Date>(untrack(() => props.activeDate || props.defaultShownDate || today));
	let activeValue = $state.raw<Date | undefined>(untrack(() => props.activeDate));
	let secondValue = $state.raw<Date | undefined>(untrack(() => props.secondDate));

	// useEffect(..., [activeDate, secondDate, isRange])
	$effect(() => {
		const nextActive = props.activeDate;
		const nextSecond = props.secondDate;
		const range = props.isRange;
		untrack(() => {
			activeValue = nextActive;
			secondValue = range ? nextSecond : undefined;
		});
	});

	// useEffect(() => setDate(activeDate || defaultShownDate || today), [activeDate])
	$effect(() => {
		const nextActive = props.activeDate;
		untrack(() => {
			date = nextActive || props.defaultShownDate || today;
		});
	});

	const setDate = (value: Date) => {
		date = value;
	};
	const setView = (value: CalendarView) => {
		view = value;
	};
	const setActiveValue = (value: Date | undefined) => {
		activeValue = value;
	};
	const setSecondValue = (value: Date | undefined) => {
		secondValue = value;
	};

	// the config React memoizes as `clickModeArgs`; built at call time so it always sees the latest state
	const getClickModeArgs = (): ClickModeConfig => ({
		activeValue,
		secondValue,
		secondDate: props.secondDate,
		view,
		isRange: props.isRange,
		showTime: props.showTime,
		timeProps: props.timeProps,
		setDate,
		setView,
		setActiveValue,
		setSecondValue,
		onChangeMonth: props.onChangeMonth,
		onChangeYear: props.onChangeYear,
		onSelect: props.onSelect
	});

	const dateClickHandler = (currDate: Date): void => {
		const clickModeArgs = getClickModeArgs();
		if (props.showTime) {
			YMDTClickMode(currDate, clickModeArgs);
			return;
		}
		switch (props.calendarMode) {
			case CALENDAR_MODE.YEARS_WITH_MONTH_DAYS_TIMES:
				YMDTClickMode(currDate, clickModeArgs);
				return;
			case CALENDAR_MODE.YEARS_WITH_MONTH_DAYS:
				YMDClickMode(currDate, clickModeArgs);
				return;
			case CALENDAR_MODE.YEARS_WITH_MONTH:
				YMClickMode(currDate, clickModeArgs);
				return;
			case CALENDAR_MODE.YEARS_ONLY:
				YClickMode(currDate, clickModeArgs);
				return;
			case CALENDAR_MODE.MONTHS_ONLY:
				MClickMode(currDate, clickModeArgs);
				return;
			case CALENDAR_MODE.MONTHS_WITH_DAYS:
				MDClickMode(currDate, clickModeArgs);
				return;
			case CALENDAR_MODE.MONTHS_WITH_DAYS_TIMES:
				MDTClickMode(currDate, clickModeArgs);
				return;
			case CALENDAR_MODE.DAYS_ONLY:
				DClickMode(currDate, clickModeArgs);
				return;
			case CALENDAR_MODE.DAYS_WITH_TIMES:
				DTClickMode(currDate, clickModeArgs);
				return;
			case CALENDAR_MODE.TIMES_ONLY:
				TClickMode(currDate, clickModeArgs);
				return;
			default:
				YMDClickMode(currDate, clickModeArgs);
		}
	};

	const changeView = (viewItem: CalendarView): void => {
		setView(viewItem);
	};

	return {
		get today() {
			return today;
		},
		get date() {
			return date;
		},
		setDate,
		get activeValue() {
			return activeValue;
		},
		setActiveValue,
		get secondValue() {
			return secondValue;
		},
		setSecondValue,
		get view() {
			return view;
		},
		setView,
		dateClickHandler,
		changeView
	};
};
