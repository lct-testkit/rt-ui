// Port of packages/ui-kit/src/components/PickerDate/utils.ts
/* eslint-disable no-plusplus */
import { CALENDAR_MODE, CALENDAR_VIEW, type CalendarMode, type CalendarView } from './constants.js';
import type { TimeProps } from './types.js';

export const getNextDay = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

export const getPrevDay = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1);

// Определяет какой календарь показывть при первом рендере
export const getView = (calendarMode: CalendarMode, showTime?: boolean): CalendarView => {
	if (calendarMode === CALENDAR_MODE.YEARS_ONLY) {
		return CALENDAR_VIEW.year;
	}
	if (calendarMode === CALENDAR_MODE.YEARS_WITH_MONTH || calendarMode === CALENDAR_MODE.MONTHS_ONLY) {
		return CALENDAR_VIEW.month;
	}
	if (
		calendarMode === CALENDAR_MODE.YEARS_WITH_MONTH_DAYS ||
		calendarMode === CALENDAR_MODE.YEARS_WITH_MONTH_DAYS_TIMES ||
		calendarMode === CALENDAR_MODE.MONTHS_WITH_DAYS ||
		calendarMode === CALENDAR_MODE.MONTHS_WITH_DAYS_TIMES ||
		calendarMode === CALENDAR_MODE.DAYS_ONLY ||
		calendarMode === CALENDAR_MODE.DAYS_WITH_TIMES ||
		showTime === true
	) {
		return CALENDAR_VIEW.day;
	}
	if (calendarMode === CALENDAR_MODE.TIMES_ONLY) {
		return CALENDAR_VIEW.time;
	}
	return CALENDAR_VIEW.day;
};

/** Everything a click mode needs (state + setters + callbacks of usePickerDate). */
export interface ClickModeConfig {
	activeValue?: Date;
	secondValue?: Date;
	secondDate?: Date;
	view: CalendarView;
	isRange?: boolean;
	showTime?: boolean;
	timeProps?: TimeProps;
	setDate: (date: Date) => void;
	setView: (view: CalendarView) => void;
	setActiveValue: (date: Date | undefined) => void;
	setSecondValue: (date: Date | undefined) => void;
	onChangeMonth?: (month: number) => void;
	onChangeYear?: (year: number) => void;
	onSelect?: (active: Date, second?: Date) => void;
}

// клики в разных режимах календарей

export const YMDTClickMode = (currDate: Date, config: ClickModeConfig): void => {
	const { activeValue, secondValue, secondDate, view, isRange, timeProps, setDate, setView, setActiveValue, setSecondValue, onChangeMonth, onChangeYear, onSelect } = config;
	const year = currDate.getFullYear();
	const month = currDate.getMonth();

	switch (view) {
		case CALENDAR_VIEW.day:
			setDate(currDate);
			setView(CALENDAR_VIEW.time);
			break;
		case CALENDAR_VIEW.month:
			setDate(new Date(year, month, 1));
			setView(CALENDAR_VIEW.day);
			if (onChangeMonth) {
				onChangeMonth(month);
			}
			break;
		case CALENDAR_VIEW.year:
			setDate(currDate);
			if (activeValue && secondValue) {
				if (currDate.getFullYear() === secondDate?.getFullYear()) {
					setDate(secondDate);
				} else if (currDate.getFullYear() === activeValue?.getFullYear()) {
					setDate(activeValue);
				} else {
					setDate(currDate);
				}
			}
			if (activeValue && !secondValue) {
				if (year === activeValue.getFullYear()) {
					setDate(activeValue);
				} else {
					setDate(new Date(year, 0, 1));
				}
			}
			setView(CALENDAR_VIEW.day);
			if (onChangeYear) {
				onChangeYear(year);
			}
			break;
		case CALENDAR_VIEW.time:
			if (isRange) {
				if ((activeValue && secondValue) || (!activeValue && !secondValue)) {
					setActiveValue(currDate);
					setSecondValue(undefined);
					if (!timeProps?.isRange) {
						setView(CALENDAR_VIEW.day);
					}
					if (onSelect) onSelect(currDate, undefined);
					return;
				}
				if (activeValue && !secondValue && activeValue <= currDate) {
					setSecondValue(currDate);
					setView(CALENDAR_VIEW.day);
					if (onSelect) onSelect(activeValue, currDate);
					return;
				}
			}
			setActiveValue(currDate);
			setView(CALENDAR_VIEW.day);
			if (onSelect) onSelect(currDate, undefined);
			break;
		default:
			if (isRange) {
				if ((activeValue && secondValue) || (!activeValue && !secondValue)) {
					setActiveValue(currDate);
					setSecondValue(undefined);
					return;
				}
				if (activeValue && !secondValue && activeValue < currDate) {
					setSecondValue(currDate);
					return;
				}
			}
			setActiveValue(currDate);
	}
};

export const YMDClickMode = (currDate: Date, config: ClickModeConfig): void => {
	const { activeValue, secondValue, view, isRange, timeProps, setDate, setView, setActiveValue, setSecondValue, onChangeMonth, onChangeYear, onSelect } = config;
	const year = currDate.getFullYear();
	const month = currDate.getMonth();

	switch (view) {
		case CALENDAR_VIEW.day:
			if (isRange) {
				if ((activeValue && secondValue) || (!activeValue && !secondValue)) {
					setActiveValue(currDate);
					setSecondValue(undefined);
					if (onSelect) onSelect(currDate, undefined);
					return;
				}
				if (activeValue && !secondValue && activeValue <= currDate) {
					setSecondValue(currDate);
					if (onSelect) onSelect(activeValue, currDate);
					return;
				}
			}
			setActiveValue(currDate);
			if (onSelect) onSelect(currDate, undefined);
			break;
		case CALENDAR_VIEW.month:
			setDate(new Date(year, month, 1));
			setView(CALENDAR_VIEW.day);
			if (onChangeMonth) {
				onChangeMonth(month);
			}
			break;
		case CALENDAR_VIEW.year:
			setDate(currDate);
			if (onChangeYear) {
				onChangeYear(year);
			}
			if (activeValue && secondValue) {
				if (currDate.getFullYear() === secondValue.getFullYear()) {
					setDate(secondValue);
				} else if (currDate.getFullYear() === activeValue.getFullYear()) {
					setDate(activeValue);
				} else {
					setDate(currDate);
				}
			}
			if (activeValue && !secondValue) {
				if (year === activeValue.getFullYear()) {
					setDate(activeValue);
				} else {
					setDate(new Date(year, 0, 1));
				}
			}
			setView(CALENDAR_VIEW.day);
			break;
		case CALENDAR_VIEW.time:
			if (isRange) {
				if ((activeValue && secondValue) || (!activeValue && !secondValue)) {
					setActiveValue(currDate);
					setSecondValue(undefined);
					if (!timeProps?.isRange) {
						setView(CALENDAR_VIEW.day);
					}
					return;
				}
				if (activeValue && !secondValue && activeValue < currDate) {
					setSecondValue(currDate);
					setView(CALENDAR_VIEW.day);
					return;
				}
			}
			setActiveValue(currDate);
			setView(CALENDAR_VIEW.day);
			break;
		default:
			if (isRange) {
				if ((activeValue && secondValue) || (!activeValue && !secondValue)) {
					setActiveValue(currDate);
					setSecondValue(undefined);
					return;
				}
				if (activeValue && !secondValue && activeValue <= currDate) {
					setSecondValue(currDate);
					return;
				}
			}
			setActiveValue(currDate);
	}
};

export const YMClickMode = (currDate: Date, config: ClickModeConfig): void => {
	const { activeValue, secondValue, secondDate, view, isRange, setDate, setView, setActiveValue, setSecondValue, onChangeMonth, onChangeYear, onSelect } = config;
	const year = currDate.getFullYear();
	const month = currDate.getMonth();
	const addingDate = new Date(year, month, 1);

	switch (view) {
		case CALENDAR_VIEW.month:
			setDate(addingDate);
			if (onChangeMonth) {
				onChangeMonth(month);
			}
			if (isRange) {
				if (activeValue && secondValue) {
					setActiveValue(addingDate);
					setSecondValue(undefined);
					setView(CALENDAR_VIEW.year);
					if (onSelect) onSelect(addingDate, undefined);
					return;
				}
				if (activeValue && !secondValue && activeValue <= addingDate) {
					setSecondValue(addingDate);
					setView(CALENDAR_VIEW.month);
					if (onSelect) onSelect(activeValue, addingDate);
					return;
				}
				if (!activeValue && !secondValue) {
					setActiveValue(addingDate);
					setView(CALENDAR_VIEW.year);
					if (onSelect) onSelect(addingDate, undefined);
					return;
				}
			}
			setActiveValue(addingDate);
			if (onSelect) onSelect(addingDate, undefined);
			break;
		case CALENDAR_VIEW.year:
			setDate(currDate);
			if (activeValue && secondValue) {
				if (currDate.getFullYear() === secondDate?.getFullYear()) {
					setDate(secondDate);
				} else if (currDate.getFullYear() === activeValue.getFullYear()) {
					setDate(activeValue);
				} else {
					setDate(currDate);
				}
			}
			if (activeValue && !secondValue) {
				if (year === activeValue.getFullYear()) {
					setDate(activeValue);
				} else {
					setDate(new Date(year, 0, 1));
				}
			}
			setView(CALENDAR_VIEW.month);
			if (onChangeYear) {
				onChangeYear(year);
			}
			break;
		default:
			if (isRange) {
				if ((activeValue && secondValue) || (!activeValue && !secondValue)) {
					setActiveValue(currDate);
					setSecondValue(undefined);
					return;
				}
				if (activeValue && !secondValue) {
					setSecondValue(currDate);
					return;
				}
			}
			setActiveValue(currDate);
	}
};

export const YClickMode = (currDate: Date, config: ClickModeConfig): void => {
	const { activeValue, secondValue, isRange, setActiveValue, setSecondValue, onChangeYear, onSelect } = config;
	const year = currDate.getFullYear();
	if (onChangeYear) {
		onChangeYear(year);
	}
	if (isRange) {
		if ((activeValue && secondValue) || (!activeValue && !secondValue)) {
			setActiveValue(currDate);
			setSecondValue(undefined);
			if (onSelect) onSelect(currDate, undefined);
			return;
		}
		if (activeValue && !secondValue) {
			if (currDate >= activeValue) {
				setSecondValue(currDate);
				if (onSelect) onSelect(activeValue, currDate);
				return;
			}
			setActiveValue(currDate);
			setSecondValue(undefined);
			if (onSelect) onSelect(currDate, undefined);
			return;
		}
	}
	setActiveValue(currDate);
	if (onSelect) onSelect(currDate, undefined);
};

export const MDTClickMode = (currDate: Date, config: ClickModeConfig): void => {
	const { activeValue, secondValue, view, isRange, timeProps, setDate, setView, setActiveValue, setSecondValue, onChangeMonth, onSelect } = config;
	const year = currDate.getFullYear();
	const month = currDate.getMonth();

	switch (view) {
		case CALENDAR_VIEW.day:
			setDate(currDate);
			setView(CALENDAR_VIEW.time);
			break;
		case CALENDAR_VIEW.month:
			setDate(new Date(year, month, 1));
			setView(CALENDAR_VIEW.day);
			if (onChangeMonth) {
				onChangeMonth(month);
			}
			break;
		case CALENDAR_VIEW.time:
			if (isRange) {
				if ((activeValue && secondValue) || (!activeValue && !secondValue)) {
					setActiveValue(currDate);
					setSecondValue(undefined);
					if (!timeProps?.isRange) {
						setView(CALENDAR_VIEW.day);
					}
					if (onSelect) onSelect(currDate, undefined);
					return;
				}
				if (activeValue && !secondValue && activeValue <= currDate) {
					setSecondValue(currDate);
					setView(CALENDAR_VIEW.day);
					if (onSelect) onSelect(activeValue, currDate);
					return;
				}
			}
			setActiveValue(currDate);
			setView(CALENDAR_VIEW.day);
			if (onSelect) onSelect(currDate, undefined);
			break;
		default:
			if (isRange) {
				if ((activeValue && secondValue) || (!activeValue && !secondValue)) {
					setActiveValue(currDate);
					setSecondValue(undefined);
					return;
				}
				if (activeValue && !secondValue && activeValue < currDate) {
					setSecondValue(currDate);
					return;
				}
			}
			setActiveValue(currDate);
	}
};

export const MDClickMode = (currDate: Date, config: ClickModeConfig): void => {
	const { activeValue, secondValue, view, isRange, setDate, setView, setActiveValue, setSecondValue, onChangeMonth, onSelect } = config;
	const year = currDate.getFullYear();
	const month = currDate.getMonth();

	switch (view) {
		case CALENDAR_VIEW.day:
			if (isRange) {
				if ((activeValue && secondValue) || (!activeValue && !secondValue)) {
					setActiveValue(currDate);
					setSecondValue(undefined);
					if (onSelect) onSelect(currDate, undefined);
					return;
				}
				if (activeValue && !secondValue && activeValue <= currDate) {
					setSecondValue(currDate);
					if (onSelect) onSelect(activeValue, currDate);
					return;
				}
			}
			setActiveValue(currDate);
			if (onSelect) onSelect(currDate, undefined);
			break;
		case CALENDAR_VIEW.month:
			setDate(new Date(year, month, 1));
			setView(CALENDAR_VIEW.day);
			if (onChangeMonth) {
				onChangeMonth(month);
			}
			break;
		default:
			if (isRange) {
				if ((activeValue && secondValue) || (!activeValue && !secondValue)) {
					setActiveValue(currDate);
					setSecondValue(undefined);
					return;
				}
				if (activeValue && !secondValue && activeValue < currDate) {
					setSecondValue(currDate);
					return;
				}
			}
			setActiveValue(currDate);
	}
};

export const MClickMode = (currDate: Date, config: ClickModeConfig): void => {
	const { activeValue, secondValue, isRange, setActiveValue, setSecondValue, onChangeMonth, onSelect } = config;
	const month = currDate.getMonth();
	if (onChangeMonth) {
		onChangeMonth(month);
	}
	if (isRange) {
		if ((activeValue && secondValue) || (!activeValue && !secondValue)) {
			setActiveValue(currDate);
			setSecondValue(undefined);
			if (onSelect) onSelect(currDate, undefined);
			return;
		}
		if (activeValue && !secondValue && activeValue <= currDate) {
			setSecondValue(currDate);
			if (onSelect) onSelect(activeValue, currDate);
			return;
		}
	}
	setActiveValue(currDate);
	if (onSelect) onSelect(currDate, undefined);
};

export const DTClickMode = (currDate: Date, config: ClickModeConfig): void => {
	const { activeValue, secondValue, view, isRange, timeProps, setDate, setView, setActiveValue, setSecondValue, onSelect } = config;

	switch (view) {
		case CALENDAR_VIEW.day:
			setDate(currDate);
			setView(CALENDAR_VIEW.time);
			break;
		case CALENDAR_VIEW.time:
			if (isRange) {
				if ((activeValue && secondValue) || (!activeValue && !secondValue)) {
					setActiveValue(currDate);
					setSecondValue(undefined);
					if (!timeProps?.isRange) {
						setView(CALENDAR_VIEW.day);
					}
					if (onSelect) onSelect(currDate, undefined);
					return;
				}
				if (activeValue && !secondValue && activeValue <= currDate) {
					setSecondValue(currDate);
					setView(CALENDAR_VIEW.day);
					if (onSelect) onSelect(activeValue, currDate);
					return;
				}
			}
			setActiveValue(currDate);
			setView(CALENDAR_VIEW.day);
			if (onSelect) onSelect(currDate, undefined);
			break;
		default:
			if (isRange) {
				if ((activeValue && secondValue) || (!activeValue && !secondValue)) {
					setActiveValue(currDate);
					setSecondValue(undefined);
					return;
				}
				if (activeValue && !secondValue && activeValue < currDate) {
					setSecondValue(currDate);
					return;
				}
			}
			setActiveValue(currDate);
	}
};

export const DClickMode = (currDate: Date, config: ClickModeConfig): void => {
	const { activeValue, secondValue, isRange, setActiveValue, setSecondValue, onSelect } = config;
	if (isRange) {
		if ((activeValue && secondValue) || (!activeValue && !secondValue)) {
			setActiveValue(currDate);
			setSecondValue(undefined);
			if (onSelect) onSelect(currDate, undefined);
			return;
		}
		if (activeValue && !secondValue && activeValue <= currDate) {
			setSecondValue(currDate);
			if (onSelect) onSelect(activeValue, currDate);
			return;
		}
	}
	setActiveValue(currDate);
	if (onSelect) onSelect(currDate, undefined);
};

export const TClickMode = (currDate: Date, config: ClickModeConfig): void => {
	const { activeValue, secondValue, isRange, setActiveValue, setSecondValue, onSelect } = config;
	if (isRange) {
		if ((activeValue && secondValue) || (!activeValue && !secondValue)) {
			setActiveValue(currDate);
			setSecondValue(undefined);
			if (onSelect) onSelect(currDate, undefined);
			return;
		}
		if (activeValue && !secondValue && activeValue <= currDate) {
			setSecondValue(currDate);
			if (onSelect) onSelect(activeValue, currDate);
			return;
		}
	}
	setActiveValue(currDate);
	if (onSelect) onSelect(currDate, undefined);
};

export const getMinutesFromInterval = (interval: number, minutes: number): number => {
	const intervalsArray: number[][] = [];
	if (interval < 60) {
		const increment = 60 / interval;
		for (let i = 0; i < increment; i++) {
			// NB: the compiled React build does `[].concat(Array(interval)).map(...)` (spread of a sparse array in
			// "loose" mode), which yields an array of holes, so no interval ever "includes" the minutes and the
			// function returns `minutes` unchanged. The reference was built from that code - keep the behaviour.
			intervalsArray.push(([] as number[]).concat(Array(interval) as number[]).map((_, idx) => interval * i + idx));
		}
		if (intervalsArray.length) {
			for (let int = 0; int < intervalsArray.length; int++) {
				if (intervalsArray[int].includes(minutes)) {
					return intervalsArray[int][0];
				}
			}
		}
	}
	return minutes;
};
