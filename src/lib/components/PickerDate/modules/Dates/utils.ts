// Port of packages/ui-kit/src/components/PickerDate/modules/Dates/utils.ts
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween.js';
import { DATE_STATUS, RANGE_GRADIENT, type DateStatus } from '../../constants.js';
import type { CalendarItemType } from '../../types.js';
import { getNextDay } from '../../utils.js';

dayjs.extend(isBetween);

export interface DatesParams {
	firstDayIndex?: number;
	minDate?: Date;
	maxDate?: Date;
	focusedDates: string[];
	disabledDates: Date[];
	enabledDates: Date[];
	isOnlyEnabled?: boolean;
	empty?: boolean;
}

export const getDaysInMonth = (year: number, month: number): number => new Date(year, month + 1, 0).getDate();

export const getFocusedDatesArray = (start?: Date, end?: Date, currDate?: Date): string[] => {
	let dates: string[] = [];
	if (start && end && currDate) {
		const startDay = start.getDate();
		const startMonth = start.getMonth();
		const startYear = start.getFullYear();
		const startFullDate = new Date(startYear, startMonth, startDay);
		const endDay = end.getDate();
		const endMonth = end.getMonth();
		const endYear = end.getFullYear();
		const endFullDate = new Date(endYear, endMonth, endDay);
		const currDateMonth = currDate.getMonth();
		const currDateYear = currDate.getFullYear();
		const currDateDaysInMonth = dayjs(currDate).daysInMonth();

		const createDates = (s: Date, e: Date): string[] => {
			const innerDates: string[] = [];
			for (let d = s; d <= e; d = getNextDay(d)) {
				innerDates.push(new Date(d).toDateString());
			}
			return innerDates;
		};

		if (startYear === endYear) {
			if (startMonth === endMonth) {
				dates = createDates(startFullDate, endFullDate);
			}
			if (startMonth < endMonth) {
				if (startMonth < currDateMonth) {
					dates = [startFullDate.toDateString()].concat(createDates(new Date(currDateYear, currDateMonth, 1), new Date(endYear, endMonth, endDay)));
				}
				if (startMonth === currDateMonth && startYear === currDateYear) {
					dates = createDates(startFullDate, new Date(currDateYear, currDateMonth, currDateDaysInMonth)).concat([endFullDate.toDateString()]);
				}
			}
		}
		if (startYear < endYear) {
			const compareDateStart = new Date(startYear, startMonth, 1);
			const compareDateCurr = new Date(currDateYear, currDateMonth, 1);
			if (compareDateCurr > compareDateStart) {
				dates = [startFullDate.toDateString()].concat(createDates(new Date(currDateYear, currDateMonth, 1), endFullDate));
			}
			if (compareDateCurr.toDateString() === compareDateStart.toDateString()) {
				dates = createDates(startFullDate, new Date(currDateYear, currDateMonth, currDateDaysInMonth)).concat([endFullDate.toDateString()]);
			}
		}
	}
	if (start && !end) {
		dates.push(start.toDateString());
	}
	return dates;
};

export const checkDisabledDate = (date: Date, params: DatesParams): boolean => {
	const { disabledDates, enabledDates, minDate, maxDate, isOnlyEnabled } = params;
	const disabledDatesToSting = disabledDates.map((i) => i.toDateString());
	const enabledDatesToString = enabledDates.map((i) => i.toDateString());

	if (enabledDatesToString.includes(date.toDateString())) {
		return false;
	}
	if (isOnlyEnabled) {
		return true;
	}
	if (disabledDatesToSting.includes(date.toDateString())) {
		return true;
	}
	if (minDate && maxDate) {
		if (date.toDateString() === minDate.toDateString() || date.toDateString() === maxDate.toDateString()) {
			return false;
		}
		return !dayjs(date).isBetween(minDate, maxDate);
	}
	if (minDate) {
		return dayjs(date).isBefore(minDate, 'day');
	}
	if (maxDate) {
		return dayjs(date).isAfter(maxDate, 'day');
	}
	return false;
};

export const getDateStatus = (date: Date, params: DatesParams): DateStatus => {
	const { focusedDates } = params;
	const dateString = date.toDateString();

	if (checkDisabledDate(date, params)) {
		return DATE_STATUS.disabled;
	}
	if (focusedDates.length > 1 && focusedDates.includes(dateString)) {
		if (dateString === focusedDates[0]) {
			return DATE_STATUS.focusedFirst;
		}
		if (dateString === focusedDates[focusedDates.length - 1]) {
			return DATE_STATUS.focusedLast;
		}
		return DATE_STATUS.focused;
	}
	if (focusedDates.length === 1 && focusedDates.includes(dateString)) {
		return DATE_STATUS.focusedFirst;
	}
	return DATE_STATUS.default;
};

export const getRangeGradient = (items: CalendarItemType[]): CalendarItemType[] => {
	let tmpItems = items.map((item, idx, arr) => {
		if (idx < arr.length - 2) {
			if (item.empty && arr[idx + 1].status === DATE_STATUS.focused) {
				return { ...item, gradient: RANGE_GRADIENT.before };
			}
		}
		return item;
	});
	if (tmpItems[tmpItems.length - 1].status === DATE_STATUS.focused && tmpItems.length !== 35) {
		tmpItems = [
			...tmpItems,
			{
				date: getNextDay(tmpItems[tmpItems.length - 1].date),
				title: String(getNextDay(tmpItems[tmpItems.length - 1].date).getDate()),
				empty: true,
				gradient: RANGE_GRADIENT.after,
				status: DATE_STATUS.default
			}
		];
	}
	return tmpItems;
};

export const getDatesArray = (from: Date, to: Date, params: DatesParams): CalendarItemType[] => {
	const dates: CalendarItemType[] = [];
	for (let d = from; d <= to; d = getNextDay(d)) {
		const date = new Date(d);
		dates.push({
			date,
			title: date.getDate().toString(),
			empty: params.empty,
			status: getDateStatus(date, params)
		});
	}
	return dates;
};

export const getDates = (date: Date, params: DatesParams): CalendarItemType[] => {
	const month = date.getMonth();
	const year = date.getFullYear();
	const dates = getDatesArray(new Date(year, month, 1), new Date(year, month, getDaysInMonth(year, month)), params);
	let prevMonthDates: CalendarItemType[] = [];
	const firstDayInMonth = new Date(year, month, 1).getDay();
	const prevMonthDateTo = getDaysInMonth(year, month - 1);

	if (firstDayInMonth !== params.firstDayIndex) {
		const prevDatesLength = (firstDayInMonth === 0 ? 7 : firstDayInMonth) - (params.firstDayIndex as number) - 1;
		prevMonthDates = getDatesArray(new Date(year, month - 1, prevMonthDateTo - prevDatesLength), new Date(year, month - 1, prevMonthDateTo), {
			...params,
			empty: true
		}).map((d) => ({ ...d, status: DATE_STATUS.default }));
	}
	return getRangeGradient([...prevMonthDates, ...dates]);
};
