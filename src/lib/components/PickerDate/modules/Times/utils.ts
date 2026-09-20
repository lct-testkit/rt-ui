// Port of packages/ui-kit/src/components/PickerDate/modules/Times/utils.ts
import dayjs, { type Dayjs } from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore.js';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter.js';
import { DATE_STATUS, DEFAULT_FULL_TIME_FORMAT, DEFAULT_MINUTES_INTERVAL, type DateStatus } from '../../constants.js';

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

export interface TimeItem {
	date: Date;
	title: string;
	status: DateStatus;
}

export const checkDisabledDate = (time: Dayjs, min?: Date, max?: Date, enabledDates?: Date[], disabledDates?: Date[]): boolean => {
	const timeString = time.format('YYYY.MM.DD HH:mm').toString();

	if (enabledDates) {
		const enabledDatesStrings = enabledDates?.map((i) => dayjs(i).format('YYYY.MM.DD HH:mm').toString());
		if (enabledDatesStrings?.includes(timeString)) return false;
	}
	if (disabledDates) {
		const disabledDatesStrings = disabledDates?.map((i) => dayjs(i).format('YYYY.MM.DD HH:mm').toString());
		if (disabledDatesStrings.includes(timeString)) return true;
	}

	const minTimeMinutes = dayjs(min).minute();
	const minTimeHours = dayjs(min).hour();
	const start = dayjs(min).hour(minTimeHours).minute(minTimeMinutes);

	const maxTimeMinutes = dayjs(max).minute();
	const maxTimeHours = dayjs(max).hour();
	const end = dayjs(max).hour(maxTimeHours).minute(maxTimeMinutes);

	if (min && max) {
		if (start.isBefore(end)) {
			if (time.isBefore(start)) {
				return true;
			}
			if (time.isAfter(end)) {
				return true;
			}
		}
		if (start.isAfter(end)) {
			if (time.isBefore(end)) {
				return true;
			}
			if (time.isAfter(start)) {
				return true;
			}
		}
		return false;
	}
	if (min || max) {
		if (min && time.isBefore(start)) {
			return true;
		}
		if (max && time.isAfter(end)) {
			return true;
		}
	}
	return false;
};

export const getTimeStatus = (
	time: Dayjs,
	focusedTimes: string[],
	format: string = DEFAULT_FULL_TIME_FORMAT,
	minTime?: Date,
	maxTime?: Date,
	activeDate?: Date,
	secondDate?: Date,
	enabledDates?: Date[],
	disabledDates?: Date[]
): DateStatus => {
	const timeString = time.format(format);

	if (checkDisabledDate(time, minTime, maxTime, enabledDates, disabledDates)) {
		return DATE_STATUS.disabled;
	}
	if (focusedTimes.includes(timeString)) {
		if (timeString === focusedTimes[0]) {
			return DATE_STATUS.focusedFirst;
		}
		if (timeString === focusedTimes[focusedTimes.length - 1]) {
			return DATE_STATUS.focusedLast;
		}
		return DATE_STATUS.focused;
	}
	if (!focusedTimes.length) {
		if (activeDate && dayjs(activeDate).format(format) === timeString) {
			return DATE_STATUS.focusedFirst;
		}
		if (secondDate && dayjs(secondDate).format(format) === timeString) {
			return DATE_STATUS.focusedLast;
		}
	}
	return DATE_STATUS.default;
};

export const getTimesArray = (
	date: Date = new Date(),
	interval: number = DEFAULT_MINUTES_INTERVAL,
	focusedTimes: string[],
	format: string = DEFAULT_FULL_TIME_FORMAT,
	renderFormat?: string,
	minCurrTime?: Date,
	maxCurrTime?: Date,
	activeDate?: Date,
	secondDate?: Date,
	enabledDates?: Date[],
	disabledDates?: Date[]
): TimeItem[] => {
	const minTime = dayjs(date).hour(0).minute(0).second(0);
	const maxTime = dayjs(date).hour(23).minute(59).second(59);
	const times: TimeItem[] = [];

	for (let i = minTime; i.isSameOrBefore(maxTime); i = i.add(interval, 'minute')) {
		times.push({
			date: new Date(i.format()),
			title: i.format(renderFormat),
			status: getTimeStatus(i, focusedTimes, format, minCurrTime, maxCurrTime, activeDate, secondDate, enabledDates, disabledDates)
		});
	}
	return times;
};

export const getFocusedTimesArray = (interval: number = DEFAULT_MINUTES_INTERVAL, start?: Date, end?: Date, format: string = DEFAULT_FULL_TIME_FORMAT, curr?: Date): string[] => {
	let times: string[] = [];
	if (start && end && curr) {
		const startMinutes = start.getMinutes();
		const startHours = start.getHours();
		const startDay = start.getDate();
		const startMonth = start.getMonth();
		const startYear = start.getFullYear();
		const startFullDate = new Date(startYear, startMonth, startDay, startHours, startMinutes);

		const endMinutes = end.getMinutes();
		const endHours = end.getHours();
		const endDay = end.getDate();
		const endMonth = end.getMonth();
		const endYear = end.getFullYear();
		const endFullDate = new Date(endYear, endMonth, endDay, endHours, endMinutes);

		const currDay = curr.getDate();
		const currMonth = curr.getMonth();
		const currYear = curr.getFullYear();

		const createTimes = (s: Date, e: Date): string[] => {
			const innerTimes: string[] = [];
			for (let i = dayjs(s); i.isSameOrBefore(e); i = i.add(interval, 'minute')) {
				innerTimes.push(i.format(format));
			}
			return innerTimes;
		};

		const compareCurrDay = new Date(currYear, currMonth, currDay, 0, 0);
		const compareStartDay = new Date(startYear, startMonth, startDay, 0, 0);
		const compareEndDay = new Date(endYear, endMonth, endDay, 0, 0);

		if (compareStartDay.toDateString() === compareEndDay.toDateString()) {
			times = createTimes(startFullDate, endFullDate);
		}
		if (compareStartDay < compareEndDay) {
			if (compareCurrDay.toDateString() === compareEndDay.toDateString()) {
				times = [startFullDate.toDateString()].concat(createTimes(compareCurrDay, endFullDate));
			}
			if (compareCurrDay.getDate() < compareEndDay.getDate()) {
				if (compareCurrDay.getDate() !== compareStartDay.getDate()) {
					times = createTimes(new Date(currYear, currMonth, currDay, 0, interval), compareCurrDay);
				}
				if (compareCurrDay.getDate() === compareStartDay.getDate()) {
					times = createTimes(startFullDate, new Date(currYear, currMonth, currDay, 23, 45)).concat([endFullDate.toDateString()]);
				}
			}
		}
	}
	return times;
};
