// Port of packages/ui-kit/src/components/PickerDate/modules/Month/utils.ts
import dayjs from 'dayjs';
import { DATE_STATUS, type DateStatus } from '../../constants.js';

export const checkDisabledMonth = (date: Date, minDate?: Date, maxDate?: Date): boolean => {
	if (minDate && maxDate) {
		const tmpMinDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
		const tmpMaxDate = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
		return dayjs(date).isBefore(tmpMinDate) || dayjs(date).isAfter(tmpMaxDate);
	}
	if (minDate) {
		const tmpMinDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
		return dayjs(date).isBefore(tmpMinDate);
	}
	if (maxDate) {
		const tmpMaxDate = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
		return dayjs(date).isAfter(tmpMaxDate);
	}
	return false;
};

export const getStatusMonth = (
	date: Date,
	month: Date,
	focusedMonths: string[] | undefined,
	activeDate?: Date,
	secondDate?: Date,
	minDate?: Date,
	maxDate?: Date
): DateStatus => {
	const compatariveActiveDate = activeDate ? new Date(activeDate.getFullYear(), activeDate.getMonth(), 1) : undefined;
	const compatariveSecondDate = secondDate ? new Date(secondDate.getFullYear(), secondDate.getMonth(), 1) : undefined;

	// NB: as in React, `checkDisabledMonth` gets the month being rendered; the calendar `date` argument itself is unused
	void date;
	if (checkDisabledMonth(month, minDate, maxDate)) {
		return DATE_STATUS.disabled;
	}
	if (activeDate && !secondDate) {
		if ((compatariveActiveDate as Date).toDateString() === month.toDateString()) return DATE_STATUS.focusedFirst;
		if (focusedMonths && focusedMonths.length && focusedMonths.includes(month.toDateString())) {
			if (month.toDateString() === focusedMonths[focusedMonths.length - 1]) {
				return DATE_STATUS.focusedLast;
			}
			return DATE_STATUS.focused;
		}
	}
	if (activeDate && secondDate) {
		if ((compatariveActiveDate as Date).toDateString() === month.toDateString()) return DATE_STATUS.focusedFirst;
		if ((compatariveSecondDate as Date).toDateString() === month.toDateString()) return DATE_STATUS.focusedLast;
		if (month > (compatariveActiveDate as Date) && month < (compatariveSecondDate as Date)) return DATE_STATUS.focused;
	}
	return DATE_STATUS.default;
};

export const getNextMonth = (m: Date): Date => {
	if (m.getMonth() + 1 === 12) {
		return new Date(m.getFullYear() + 1, 0, 1);
	}
	return new Date(m.getFullYear(), m.getMonth() + 1, 1);
};

export const getFocusedMonthsArray = (start?: Date, end?: Date): string[] => {
	const months: string[] = [];
	if (start && end) {
		for (let m = start; m <= end; m = getNextMonth(m)) {
			months.push(m.toDateString());
		}
	}
	return months;
};
