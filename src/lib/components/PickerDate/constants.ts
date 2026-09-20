// Port of packages/ui-kit/src/components/PickerDate/constants.ts (enums become const objects + string unions).

export const DEFAULT_DATE_FORMAT = 'DD.MM.YYYY';
export const DAYS_OF_WEEK = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];
export const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

export const CALENDAR_VIEW = {
	day: 'day',
	month: 'month',
	year: 'year',
	time: 'time'
} as const;
export type CalendarView = (typeof CALENDAR_VIEW)[keyof typeof CALENDAR_VIEW];

export const CALENDAR_MODE = {
	YEARS_ONLY: 'YEARS_ONLY',
	YEARS_WITH_MONTH: 'YEARS_WITH_MONTH',
	YEARS_WITH_MONTH_DAYS: 'YEARS_WITH_MONTH_DAYS',
	YEARS_WITH_MONTH_DAYS_TIMES: 'YEARS_WITH_MONTH_DAYS_TIMES',
	MONTHS_ONLY: 'MONTHS_ONLY',
	MONTHS_WITH_DAYS: 'MONTHS_WITH_DAYS',
	MONTHS_WITH_DAYS_TIMES: 'MONTHS_WITH_DAYS_TIMES',
	DAYS_ONLY: 'DAYS_ONLY',
	DAYS_WITH_TIMES: 'DAYS_WITH_TIMES',
	TIMES_ONLY: 'TIMES_ONLY'
} as const;
export type CalendarMode = (typeof CALENDAR_MODE)[keyof typeof CALENDAR_MODE];

export const DATE_STATUS = {
	default: 'default',
	disabled: 'disabled',
	focused: 'focused',
	focusedFirst: 'focusedFirst',
	focusedLast: 'focusedLast'
} as const;
export type DateStatus = (typeof DATE_STATUS)[keyof typeof DATE_STATUS];

export const RANGE_GRADIENT = {
	before: 'before',
	after: 'after'
} as const;
export type RangeGradient = (typeof RANGE_GRADIENT)[keyof typeof RANGE_GRADIENT];

export const DEFAULT_TIME_FORMAT = 'HH:mm';
export const DEFAULT_FULL_TIME_FORMAT = 'DD.MM.YYYY HH:mm';
export const DEFAULT_MINUTES_INTERVAL = 15;
export const MIN_YEAR = 1980;
export const MAX_YEAR = new Date().getFullYear() + 10;
