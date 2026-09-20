// Port of packages/ui-kit/src/components/InputDate/utils.ts (date <-> string helpers of the InputDate).
/* eslint-disable no-nested-ternary */
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import isBetween from 'dayjs/plugin/isBetween.js';
import IMask from 'imask';
import { DATE_RANGE_SEPARATOR } from './constants.js';

// React: `dayjs.extend(customParseFormat)` runs in the hook on every render (`isBetween` is extended by PickerDate).
dayjs.extend(customParseFormat);
dayjs.extend(isBetween);

export interface DateRangeValue {
	start?: Date;
	end?: Date;
}

export interface ParseDateParams {
	isRange?: boolean;
	dateFormat: string;
	isOpenCalendar?: boolean;
}

export const isValidDateFormat = (dateString: string, dateFormat: string): boolean => dayjs(dateString, dateFormat).isValid();

export const isValidDateRangeFormat = (dateString: string, dateFormat: string): boolean => {
	const [dateFrom, dateTo] = dateString.split(DATE_RANGE_SEPARATOR);
	const formattedDateFrom = dayjs(dateFrom, dateFormat).format(dateFormat);
	const formattedDateTo = dayjs(dateTo, dateFormat).format(dateFormat);
	const formattedDate = `${formattedDateFrom}${DATE_RANGE_SEPARATOR}${formattedDateTo}`;
	return formattedDate === dateString && formattedDate.length === dateFormat.length * 2 + DATE_RANGE_SEPARATOR.length;
};

export const isPartiallyValidDateRangeFormat = (
	dateString: string,
	dateFormat: string
): { from: { valid: boolean; date: string }; to: { valid: boolean; date: string } } => {
	const [dateFrom, dateTo] = dateString.split(DATE_RANGE_SEPARATOR);
	const formattedDateFrom = dayjs(dateFrom, dateFormat).format(dateFormat);
	const formattedDateTo = dayjs(dateTo, dateFormat).format(dateFormat);
	return {
		from: { valid: formattedDateFrom !== 'Invalid Date', date: formattedDateFrom },
		to: { valid: formattedDateTo !== 'Invalid Date', date: formattedDateTo }
	};
};

/** Options of an imask `Masked` date mask (unused by the component, kept from the React sources). */
export const getDateMaskParams = (dateFormat: string, minYear: number, maxYear: number, minDate?: Date, maxDate?: Date) => ({
	mask: Date,
	pattern: dateFormat,
	overwrite: true,
	autofix: true,
	min: minDate,
	max: maxDate,
	format: (date: Date) => dayjs(date, dateFormat).format(dateFormat),
	parse: (str: string) => dayjs(str, dateFormat),
	blocks: {
		YYYY: { mask: IMask.MaskedRange, from: minYear, to: maxYear },
		MM: { mask: IMask.MaskedRange, from: 1, to: 12 },
		DD: { mask: IMask.MaskedRange, from: 1, to: 31 },
		HH: { mask: IMask.MaskedRange, from: 0, to: 23 },
		mm: { mask: IMask.MaskedRange, from: 0, to: 59 }
	}
});

export const getScopeDate = (value: string, dateFormat: string, minDate?: Date, maxDate?: Date): Date => {
	const date = dayjs(value, dateFormat).format();
	if (minDate && maxDate) {
		if (dayjs(date).isBetween(minDate, dayjs(maxDate))) {
			return dayjs(date).toDate();
		}
		const date1 = dayjs(date).diff(dayjs(minDate));
		const date2 = dayjs(date).diff(dayjs(maxDate));
		return Math.abs(date1) < Math.abs(date2) ? dayjs(minDate).toDate() : dayjs(maxDate).toDate();
	}
	if (minDate && dayjs(date).isBefore(dayjs(minDate))) {
		return dayjs(minDate).toDate();
	}
	if (maxDate && dayjs(date).isAfter(dayjs(maxDate))) {
		return dayjs(maxDate).toDate();
	}
	return dayjs(date).toDate();
};

export const formattingDateRange = (dates: DateRangeValue, params: ParseDateParams): string =>
	dates.start && dates.end
		? `${dayjs(dates.start).format(params.dateFormat)}${DATE_RANGE_SEPARATOR}${dayjs(dates.end).format(params.dateFormat)}`
		: dates.start
			? params.isOpenCalendar
				? `${dayjs(dates.start).format(params.dateFormat)}${DATE_RANGE_SEPARATOR}`
				: `${dayjs(dates.start).format(params.dateFormat)}${DATE_RANGE_SEPARATOR}...`
			: '';

export const parseDateToString = (dates: DateRangeValue, params: ParseDateParams): string => {
	if (params.isRange) {
		return formattingDateRange(dates, params);
	}
	return dates.start ? dayjs(dates.start).format(params.dateFormat) : '';
};
