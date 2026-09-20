// Types of PickerDate (declared in the React sources inline / in PickerDate.types.ts).
import type { CalendarView, DateStatus, RangeGradient } from './constants.js';

/** Одна ячейка календаря (день / месяц / год / время) */
export interface CalendarItemType {
	date: Date;
	title: string;
	empty?: boolean;
	gradient?: RangeGradient;
	status: DateStatus;
}

export interface TimeProps {
	/** Диапазон времени внутри выбранного диапазона дат */
	isRange?: boolean;
	/** Интервал (в минутах) между значениями времени */
	interval?: number;
	/** Формат отображения времени (dayjs) */
	format?: string;
}

export type { CalendarView };
