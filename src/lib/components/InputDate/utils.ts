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

// ─── разбор набранного текста (одиночная дата) ───────────────────────────────────────────────────────────────────

/** Что набрано в поле одиночной даты. */
export type DateTextStatus =
	/** пусто */
	| 'empty'
	/** полная существующая дата */
	| 'valid'
	/** набор не закончен */
	| 'partial'
	/** день и месяц есть, год — меньше четырёх цифр (`01.01.26`) */
	| 'shortYear'
	/** текст набран целиком, но такой даты нет (`31.02.2026`, месяц 13, день 00) */
	| 'nonexistent';

/** Тексты ошибок поля даты (`null` — набор в порядке). */
export const DATE_TEXT_ERRORS: Record<DateTextStatus, string | null> = {
	empty: null,
	valid: null,
	partial: 'Введите дату полностью',
	shortYear: 'Введите год полностью',
	nonexistent: 'Такой даты нет'
};

const FORMAT_TOKEN = /YYYY|YY|MMMM|MMM|MM|M|DD|D|HH|H|hh|h|mm|m|ss|s|A|a|\[[^\]]*\]|./g;
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** `^<всё до года, целиком>\d{1,3}$` — текст, оборвавшийся внутри года; `null`, если года в формате нет. */
const shortYearRe = (dateFormat: string): RegExp | null => {
	let source = '';
	for (const token of dateFormat.match(FORMAT_TOKEN) ?? []) {
		if (token === 'YYYY') return new RegExp(`^${source}[0-9]{1,3}$`);
		source += /^(MM|DD|HH|hh|mm|ss|YY)$/.test(token) ? '[0-9]{2}' : escapeRe(token.replace(/^\[|\]$/g, ''));
	}
	return null;
};

/** Разбирает набранный текст строго: `31.02.2026` — это `nonexistent`, а не 3 марта. */
export const getDateTextStatus = (text: string, dateFormat: string): DateTextStatus => {
	if (!text) return 'empty';
	const parsed = dayjs(text, dateFormat, true);
	// год меньше 1000 маска и раньше не пускала: `01.01.0026` — тоже «такой даты нет»
	if (parsed.isValid()) return parsed.year() >= 1000 ? 'valid' : 'nonexistent';
	if (text.length >= dateFormat.length) return 'nonexistent';
	return shortYearRe(dateFormat)?.test(text) ? 'shortYear' : 'partial';
};

/** Что набрано в поле периода: статус даты или `reversed` (обе даты есть, но конец раньше начала). */
export type DateRangeTextStatus = DateTextStatus | 'reversed';

/** Тексты ошибок поля периода (`null` — набор в порядке). */
export const DATE_RANGE_TEXT_ERRORS: Record<DateRangeTextStatus, string | null> = {
	...DATE_TEXT_ERRORS,
	reversed: 'Конец периода раньше начала'
};

/** Разбор текста периода `<начало> - <конец>` на две части; заглушка `...` (начало без конца при закрытом календаре) — это пустой конец. */
export const splitDateRangeText = (text: string): [string, string] => {
	const [from = '', to = ''] = text.split(DATE_RANGE_SEPARATOR);
	return [from, to === '...' ? '' : to];
};

/**
 * Разбирает набранный текст периода так же строго, как одиночную дату (`getDateTextStatus`) — для каждого из двух концов.
 * Если ошибки есть у обоих, показывается самая «жёсткая»: несуществующая дата → год из 2 цифр → не дописано.
 * Начало есть, конца нет — это не ошибка текста (`valid`: период ещё не закончен, это решает правило «Укажите окончание периода»).
 */
export const getDateRangeTextStatus = (text: string, dateFormat: string): DateRangeTextStatus => {
	if (!text) return 'empty';
	const [fromText, toText] = splitDateRangeText(text);
	const from = getDateTextStatus(fromText, dateFormat);
	const to = getDateTextStatus(toText, dateFormat);
	const statuses: DateTextStatus[] = [from, to];
	for (const bad of ['nonexistent', 'shortYear'] as const) {
		if (statuses.includes(bad)) return bad;
	}
	// конец набран, а начала нет (стёрли) — не дописано
	if (from === 'partial' || to === 'partial' || (from === 'empty' && to !== 'empty')) return 'partial';
	if (from === 'valid' && to === 'valid' && dayjs(toText, dateFormat, true).isBefore(dayjs(fromText, dateFormat, true))) return 'reversed';
	return 'valid';
};

/**
 * Параметры imask для поля даты (и каждого из двух полей периода): маска только расставляет точки и пускает цифры, ничего не «исправляет»;
 * существует ли дата, решают `getDateTextStatus` / `getDateRangeTextStatus`.
 */
export const getInputDateMaskOptions = (dateFormat: string): Record<string, any> => {
	const months = Array.from({ length: 12 }, (_, i) => new Date(0, i).toLocaleString('en', { month: 'long' }));
	return {
		mask: dateFormat,
		lazy: true,
		overwrite: true,
		blocks: {
			YYYY: { mask: '0000' },
			MM: { mask: '00' },
			MMMM: {
				mask: IMask.MaskedEnum,
				enum: months,
				matchValue: (estr: string, istr: string, matchFrom: any) =>
					(IMask.MaskedEnum as any).DEFAULTS.matchValue(estr.toLowerCase(), istr.toLowerCase(), matchFrom)
			},
			DD: { mask: '00' },
			HH: { mask: '00' },
			mm: { mask: '00' }
		}
	};
};
