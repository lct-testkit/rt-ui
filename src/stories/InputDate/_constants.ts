// Port of stories/InputDate/constants.ts
export const DAYS_OF_WEEK = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];
export const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
export const DisabledDatesExample = [
	new Date('07.12.2023'),
	new Date('07.13.2023'),
	new Date('07.14.2023'),
	new Date('07.15.2023'),
	new Date('07.16.2023'),
	new Date('07.17.2023')
];
export const EnabledDatesExample = [new Date('07.14.2023'), new Date('07.15.2023')];
export const CALENDAR_MODE_TO_DATE_FORMAT: Record<string, string> = {
	YEARS_ONLY: 'YYYY',
	YEARS_WITH_MONTH: 'MMMM YYYY',
	YEARS_WITH_MONTH_DAYS: 'DD MMMM YYYY',
	YEARS_WITH_MONTH_DAYS_TIMES: 'DD.MM.YYYY HH:mm',
	MONTHS_ONLY: 'MMMM',
	MONTHS_WITH_DAYS: 'DD MMMM',
	MONTHS_WITH_DAYS_TIMES: 'DD MMMM HH:mm',
	DAYS_ONLY: 'DD',
	DAYS_WITH_TIMES: 'DD HH:mm',
	TIMES_ONLY: 'HH:mm'
};
