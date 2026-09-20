// Port of packages/ui-kit/src/components/PickerDate/modules/Years/utils.ts
import dayjs from 'dayjs';
import { DATE_STATUS, type DateStatus } from '../../constants.js';

export const checkDisabledYear = (year: number, minDate?: Date, maxDate?: Date): boolean => {
	const date = new Date(year, 0, 1);
	if (minDate && maxDate) {
		const tmpMinDate = new Date(minDate.getFullYear(), 0, 1);
		const tmpMaxDate = new Date(maxDate.getFullYear(), 0, 1);
		return dayjs(date).isBefore(tmpMinDate) || dayjs(date).isAfter(tmpMaxDate);
	}
	if (minDate) {
		const tmpMinDate = new Date(minDate.getFullYear(), 0, 1);
		return dayjs(date).isBefore(tmpMinDate);
	}
	if (maxDate) {
		const tmpMaxDate = new Date(maxDate.getFullYear(), 0, 1);
		return dayjs(date).isAfter(tmpMaxDate);
	}
	return false;
};

export const getStatusYears = (
	_date: Date,
	year: number,
	activeDate?: Date,
	secondDate?: Date,
	focusedYears?: number[],
	minDate?: Date,
	maxDate?: Date
): DateStatus => {
	if (checkDisabledYear(year, minDate, maxDate)) {
		return DATE_STATUS.disabled;
	}
	if (activeDate && !secondDate) {
		if (activeDate.getFullYear() === year) {
			return DATE_STATUS.focusedFirst;
		}
		if (focusedYears && focusedYears.includes(year)) {
			if (year === focusedYears[focusedYears.length - 1]) {
				return DATE_STATUS.focusedLast;
			}
			return DATE_STATUS.focused;
		}
	}
	if (activeDate && secondDate) {
		if (activeDate.getFullYear() === year) return DATE_STATUS.focusedFirst;
		if (secondDate.getFullYear() === year) return DATE_STATUS.focusedLast;
		if (year > activeDate.getFullYear() && year < secondDate.getFullYear()) return DATE_STATUS.focused;
	}
	return DATE_STATUS.default;
};

export const getNextYear = (year: Date): Date => new Date(year.getFullYear() + 1, year.getMonth(), year.getDate());

export const getFocusedYearsArray = (start?: Date, end?: Date): number[] => {
	const years: number[] = [];
	if (start && end) {
		for (let s = start; s.getFullYear() <= end.getFullYear(); s = getNextYear(s)) {
			years.push(s.getFullYear());
		}
	}
	return years;
};
