<script lang="ts">
	// Port of packages/ui-kit/src/components/PickerDate/PickerDate.tsx (+ modules/Picker/PickerContextProvider.tsx)
	//
	//   <PickerDate calendarMode="YEARS_WITH_MONTH_DAYS" isRange onSelect={(active, second) => ...} />
	//
	// * The current view (day / month / year / time) picks one of the view modules (Dates / Months / Years / Times). Each module
	//   owns the highlighted-range state and renders the `Calendar`; switching the view remounts the module + calendar (like React,
	//   where the module component type changes).
	// * `activeDate` / `secondDate` are only the initial / controlled values; the clicks change the internal state and call
	//   `onSelect(active, second?)` (see `usePickerDate.svelte.ts`).
	// * `chevronLeft` / `chevronRight` / `renderDate` are snippets (React: ReactNode / render function).
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Content } from '../../internal/types.js';
	import { useFilterAttrs } from '../../hooks/useFilterAttrs.js';
	import type { StyleValue } from '../../utils/style.js';
	import type { MotionProp } from '../../ext/motion.svelte.js';
	import Calendar from './components/Calendar/Calendar.svelte';
	import { CALENDAR_MODE, CALENDAR_VIEW, DAYS_OF_WEEK, DEFAULT_FULL_TIME_FORMAT, DEFAULT_TIME_FORMAT, MONTHS, type CalendarMode, type CalendarView } from './constants.js';
	import DatesContextProvider from './modules/Dates/DatesContextProvider.svelte';
	import MonthContextProvider from './modules/Month/MonthContextProvider.svelte';
	import { setPickerContext } from './modules/Picker/context.js';
	import TimesContextProvider from './modules/Times/TimesContextProvider.svelte';
	import YearsContextProvider from './modules/Years/YearsContextProvider.svelte';
	import type { CalendarItemType, TimeProps } from './types.js';
	import { usePickerDate } from './usePickerDate.svelte.js';

	export interface PickerDateProps extends Omit<HTMLAttributes<HTMLDivElement>, 'style' | 'children'> {
		/** Значение активной даты по умолчанию */
		activeDate?: Date;
		/** Значение второй даты по умолчанию */
		secondDate?: Date;
		/** Задает названия дней недели */
		daysOfWeek?: string[];
		/** Дает возможность выбрать период из двух дат */
		isRange?: boolean;
		/** Принудительно делает доступными даты только из массива enabledDates */
		isOnlyEnabled?: boolean;
		/** Добавляет возможность выбора времени PickerTime */
		showTime?: boolean;
		/** Задает параметры для выбора времени */
		timeProps?: TimeProps;
		/** Задаёт вариант для компонента */
		variant?: string;
		/** Задает размер */
		size?: string;
		/** Задает названия месяцев */
		months?: string[];
		/** Задает минимальный отображаемый год в календаре */
		minYear?: number;
		/** Задает максимальный отображаемый год в календаре */
		maxYear?: number;
		/** Задает минимальную дату для выбора */
		minDate?: Date;
		/** Задает максимальную дату для выбора */
		maxDate?: Date;
		/** Конфигурация календаря – определяет какие календари отображать */
		calendarMode?: CalendarMode;
		/** Задает заблокированные даты, которые нельзя выбрать */
		disabledDates?: Date[];
		/** Задает доступные даты с самым большим приоритетом */
		enabledDates?: Date[];
		/** Задаёт дату, на которой пикер отобразит календарь при открытии */
		defaultShownDate?: Date;
		/** Callback функция, вызываемая при изменении значения */
		onSelect?: (activeDate: Date, secondDate?: Date) => void;
		/** Callback, вызываемый при изменении месяца */
		onChangeMonth?: (month: number) => void;
		/** Callback, вызываемый при изменении года */
		onChangeYear?: (year: number) => void;
		/** Задает кастомный левый chevron (по умолчанию `<ChevronLeft />`) */
		chevronLeft?: Content;
		/** Задает кастомный правый chevron (по умолчанию `<ChevronRight />`) */
		chevronRight?: Content;
		/** Функция, которая дает возможность кастомного вывода даты */
		renderDate?: Snippet<[CalendarItemType, CalendarView]>;
		/** Задает дополнительные стили для компонента */
		style?: StyleValue;
		/**
		 * [ext, not in original] Svelte-анимация календаря: смена месяца / года (сдвиг + fade в сторону перехода), смена вида (масштаб + fade),
		 * плавное появление выделения дня / периода. `undefined` — наследуется от `ExtMotionProvider` (без него выключено = оригинал), `false` — выключено,
		 * `true` / `{ duration, easing }` — включено.
		 */
		motion?: MotionProp;
	}

	let {
		activeDate,
		secondDate,
		daysOfWeek = DAYS_OF_WEEK,
		isRange = false,
		isOnlyEnabled = false,
		showTime = false,
		timeProps = { isRange: false, interval: 15, format: DEFAULT_TIME_FORMAT },
		variant = 'primary',
		size = 'm',
		months = MONTHS,
		minYear = 1980,
		maxYear = 2040,
		minDate = undefined,
		maxDate = undefined,
		calendarMode = CALENDAR_MODE.YEARS_WITH_MONTH_DAYS,
		disabledDates = [],
		enabledDates = [],
		defaultShownDate,
		onSelect,
		onChangeMonth,
		onChangeYear,
		chevronLeft,
		chevronRight,
		renderDate,
		motion,
		...restProps
	}: PickerDateProps = $props();

	const rootAttrs = $derived(useFilterAttrs(restProps)[0]);

	const picker = usePickerDate({
		get activeDate() {
			return activeDate;
		},
		get secondDate() {
			return secondDate;
		},
		get isRange() {
			return isRange;
		},
		get onSelect() {
			return onSelect;
		},
		get showTime() {
			return showTime;
		},
		get timeProps() {
			return timeProps;
		},
		get onChangeMonth() {
			return onChangeMonth;
		},
		get onChangeYear() {
			return onChangeYear;
		},
		get calendarMode() {
			return calendarMode;
		},
		get defaultShownDate() {
			return defaultShownDate;
		}
	});

	// modules/Picker/PickerContextProvider.tsx
	setPickerContext({
		get rootAttrs() {
			return rootAttrs;
		},
		get view() {
			return picker.view;
		},
		get nameOfMonths() {
			return months;
		},
		get daysOfWeek() {
			return daysOfWeek;
		},
		get date() {
			return picker.date;
		},
		setDate: picker.setDate,
		get today() {
			return picker.today;
		},
		dateClickHandler: picker.dateClickHandler,
		changeView: picker.changeView,
		get variant() {
			return variant;
		},
		get size() {
			return size;
		},
		get activeDate() {
			return picker.activeValue;
		},
		get secondDate() {
			return picker.secondValue;
		},
		get renderDate() {
			return renderDate;
		},
		get calendarMode() {
			return calendarMode;
		},
		get isRange() {
			return isRange;
		},
		get chevronLeft() {
			return chevronLeft;
		},
		get chevronRight() {
			return chevronRight;
		},
		get onChangeYear() {
			return onChangeYear;
		},
		get onChangeMonth() {
			return onChangeMonth;
		},
		get onSelect() {
			return onSelect;
		},
		get motion() {
			return motion;
		}
	});
</script>

{#if picker.view === CALENDAR_VIEW.day}
	<DatesContextProvider
		date={picker.date}
		activeDate={picker.activeValue}
		secondDate={picker.secondValue}
		{isRange}
		{minDate}
		{maxDate}
		{disabledDates}
		{enabledDates}
		{isOnlyEnabled}
	>
		{#snippet children(viewData)}
			<Calendar {minDate} {maxDate} {viewData} />
		{/snippet}
	</DatesContextProvider>
{:else if picker.view === CALENDAR_VIEW.year}
	<YearsContextProvider
		{minYear}
		{maxYear}
		{minDate}
		{maxDate}
		date={picker.date}
		activeDate={picker.activeValue}
		secondDate={picker.secondValue}
		{isRange}
	>
		{#snippet children(viewData)}
			<Calendar {minDate} {maxDate} {viewData} />
		{/snippet}
	</YearsContextProvider>
{:else if picker.view === CALENDAR_VIEW.month}
	<MonthContextProvider
		{months}
		date={picker.date}
		activeDate={picker.activeValue}
		secondDate={picker.secondValue}
		{isRange}
		{minDate}
		{maxDate}
	>
		{#snippet children(viewData)}
			<Calendar {minDate} {maxDate} {viewData} />
		{/snippet}
	</MonthContextProvider>
{:else if picker.view === CALENDAR_VIEW.time}
	<TimesContextProvider
		interval={timeProps.interval}
		format={DEFAULT_FULL_TIME_FORMAT}
		date={picker.date}
		activeDate={picker.activeValue}
		secondDate={picker.secondValue}
		{isRange}
		renderFormat={timeProps.format}
		{minDate}
		{maxDate}
		{disabledDates}
		{enabledDates}
		{isOnlyEnabled}
	>
		{#snippet children(viewData)}
			<Calendar {minDate} {maxDate} {viewData} />
		{/snippet}
	</TimesContextProvider>
{/if}
