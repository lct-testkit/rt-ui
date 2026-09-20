<script lang="ts">
	// Port of components/Calendar/{useCalendar.tsx, Calendar.tsx}
	//
	// React: `useCalendar` reads the picker context + the context of the CURRENT view's module (Dates / Months / Years / Times);
	// here the module (`modules/*/…ContextProvider.svelte`) renders the Calendar itself and hands its own `items` and mouse
	// handlers over in `viewData`, the picker-wide values come from the picker context.
	import clsx from 'clsx';
	import dayjs from 'dayjs';
	import isBetween from 'dayjs/plugin/isBetween.js';
	import isSameOrAfter from 'dayjs/plugin/isSameOrAfter.js';
	import isSameOrBefore from 'dayjs/plugin/isSameOrBefore.js';
	import { onMount, untrack } from 'svelte';
	import { styleToString } from '../../../../utils/style.js';
	// [ext, not in original] author's motion extension (off by default, see src/lib/ext/README.md)
	import { explicitMotion, softHighlight, usePageNav } from '../../../../ext/calendarMotion.svelte.js';
	import { useMotion } from '../../../../ext/motion.svelte.js';
	import { rtShift } from '../../../../ext/transitions.js';
	import { CALENDAR_MODE, CALENDAR_VIEW, DATE_STATUS, DEFAULT_DATE_FORMAT, type CalendarView, type DateStatus } from '../../constants.js';
	import { getPickerContext, type ViewContextValue } from '../../modules/Picker/context.js';
	import MonthWithDaysHeader from '../Header/MonthWithDaysHeader.svelte';
	import YearsWithMonthDaysHeader from '../Header/YearsWithMonthDaysHeader.svelte';
	import YearsWithMonthHeader from '../Header/YearsWithMonthHeader.svelte';
	import type { RangeGradient } from '../../constants.js';
	import { scheduleContinuous } from '../../scheduler.js';

	dayjs.extend(isBetween);
	dayjs.extend(isSameOrAfter);
	dayjs.extend(isSameOrBefore);

	interface Props {
		minDate?: Date;
		maxDate?: Date;
		/** items + mouse handlers of the module of the current view */
		viewData: ViewContextValue;
	}

	let { minDate, maxDate, viewData }: Props = $props();

	const picker = getPickerContext();

	const items = $derived(viewData.items);
	const view = $derived(picker.view);
	const date = $derived(picker.date);
	const today = $derived(picker.today);
	const variant = $derived(picker.variant);
	const size = $derived(picker.size);
	const calendarMode = $derived(picker.calendarMode);
	const nameOfMonths = $derived(picker.nameOfMonths);
	const daysOfWeek = $derived(picker.daysOfWeek);
	const isRange = $derived(picker.isRange);
	const isSecondDate = $derived(!!picker.secondDate);
	const isActiveDate = $derived(!!picker.activeDate);
	const rootAttrs = $derived(picker.rootAttrs);

	// ---- [ext, not in original] motion: with it off (the default) none of this changes anything -----------------------------------
	const m = useMotion(() => picker.motion, 'calendar');
	const explicit = $derived(explicitMotion(picker.motion));
	/** the view this instance was created for (a view change re-creates the whole Calendar) */
	const initialView = untrack(() => picker.view);
	/** a number that grows with the visible page: month (day view), year (month view), day (time view) */
	const pageKey = $derived(
		view === CALENDAR_VIEW.day
			? date.getFullYear() * 12 + date.getMonth()
			: view === CALENDAR_VIEW.month
				? date.getFullYear()
				: view === CALENDAR_VIEW.time
					? Math.floor(new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() / 86400000)
					: 0
	);
	const nav = usePageNav(
		() => pageKey,
		() => m.enabled
	);
	/** only the day / month grids are paged (the year list and the time list keep their DOM and their scroll position) */
	const gridPaged = $derived(view === CALENDAR_VIEW.day || view === CALENDAR_VIEW.month);
	const gridKey = $derived(gridPaged ? nav.key : 0);
	const swap = {
		get m() {
			return m;
		},
		get dir() {
			return nav.dir;
		},
		get prop() {
			return picker.motion;
		}
	};
	// (evaluated when a transition starts.) A grid that appears in a freshly created Calendar is a CHANGE OF VIEW (day / month / year re-creates the
	// whole Calendar): it zooms in; the box of the calendar (background, border) stays. Every later grid is a page change: it slides with the direction.
	// A leaving grid only animates while its Calendar stays (a change of view removes the Calendar at once). The `in:` is `global` because the first grid of a
	// new Calendar lives in a `{#key}` block that is created together with it (a local intro plays only for a block that is re-run later); Svelte still plays
	// no global intro while the app itself is being mounted, so nothing animates on load.
	const gridIn = () => (nav.moved ? { ...explicit, enabled: m.enabled && gridPaged, dir: nav.dir } : { ...explicit, enabled: m.enabled, kind: 'zoom' as const });
	const gridOut = () => ({ ...explicit, enabled: m.enabled && gridPaged && picker.view === initialView, dir: nav.dir });

	const isFocusedExist = $derived(items.some((el) => el.status === DATE_STATUS.focused || el.status === DATE_STATUS.focusedLast));

	// ---- header (React: `useMemo` switch over calendarMode) ------------------------------------------------------------------
	const prevYear = $derived(dayjs(date).add(-1, 'year').toDate());
	const nextYear = $derived(dayjs(date).add(1, 'year').toDate());
	const prevMonth = $derived(dayjs(date).add(-1, 'month').toDate());
	const nextMonth = $derived(dayjs(date).add(1, 'month').toDate());
	const prevDay = $derived(dayjs(date).add(-1, 'day').toDate());
	const nextDay = $derived(dayjs(date).add(1, 'day').toDate());
	const fullDate = $derived(dayjs(date).format(DEFAULT_DATE_FORMAT));

	const checkYear = (value: Date): boolean => {
		if (minDate && maxDate) {
			return value.getFullYear() >= minDate.getFullYear() && value.getFullYear() <= maxDate.getFullYear();
		}
		if (minDate) {
			return value.getFullYear() >= minDate.getFullYear();
		}
		if (maxDate) {
			return value.getFullYear() <= maxDate.getFullYear();
		}
		return true;
	};

	const checkMonth = (value: Date): boolean => {
		if (minDate && maxDate) {
			return dayjs(value).isBetween(minDate, maxDate, 'month', '[]');
		}
		if (minDate) {
			return dayjs(value).isSameOrAfter(minDate, 'month');
		}
		if (maxDate) {
			return dayjs(value).isSameOrBefore(maxDate, 'month');
		}
		return true;
	};

	const checkDayOrMonth = (value: Date, isDayMode: boolean = false): boolean => {
		if (minDate && maxDate) {
			return dayjs(value).isBetween(minDate, maxDate, isDayMode ? 'days' : 'month', '[]');
		}
		if (minDate) {
			return dayjs(value).isSameOrAfter(minDate, isDayMode ? 'days' : 'month');
		}
		if (maxDate) {
			return dayjs(value).isSameOrBefore(maxDate, isDayMode ? 'days' : 'month');
		}
		return true;
	};

	const changeYear = (value: Date): void => {
		picker.setDate(value);
		picker.onChangeYear?.(value.getFullYear());
	};

	const changeYearAndMonth = (value: Date): void => {
		picker.setDate(value);
		picker.onChangeYear?.(value.getFullYear());
		picker.onChangeMonth?.(value.getMonth());
	};

	const changeView = (v: CalendarView): void => picker.changeView(v);

	// ---- classes ---------------------------------------------------------------------------------------------------------------
	const rootClassName = $derived(
		clsx(
			'atmr-calendar',
			`atmr-calendar--size-${size}`,
			`atmr-calendar--${variant}`,
			`atmr-calendar--${view}`,
			`atmr-calendar--${calendarMode.toLowerCase()}`,
			isSecondDate && 'atmr-calendar--second-date',
			isRange && 'atmr-calendar--range',
			isFocusedExist && 'atmr-calendar--focused-exist',
			isActiveDate && 'atmr-calendar--active-date',
			rootAttrs?.class
		)
	);

	const calendarItemClassName = (status: DateStatus, empty: boolean, isToday: boolean, gradient?: RangeGradient): string =>
		clsx('atmr-calendar__item', `atmr-calendar__item--${status}`, empty && 'atmr-calendar__item--empty', isToday && 'atmr-calendar__item--today', gradient && `atmr-calendar__item--gradient-${gradient}`);

	const isTodayItem = (itemDate: Date): boolean => (view === CALENDAR_VIEW.day ? today.toDateString() === itemDate.toDateString() : today.toLocaleString() === itemDate.toLocaleString());

	// ---- scroll to the first / last focused item on mount ----------------------------------------------------------------------
	// React: `getItemRef(...)` hands `firstItemRref` / `lastItemRref` to (the last of) the matching items and a mount-only effect
	// scrolls `.atmr-calendar__calendar` by their `offsetTop`.
	const getItemRef = (status: DateStatus, itemDate: Date): 'first' | 'last' | null => {
		if (!isSecondDate && !isActiveDate) {
			if (view === CALENDAR_VIEW.day) {
				if (today.toDateString() === itemDate.toDateString()) {
					return 'first';
				}
			}
			if (today.toLocaleString() === itemDate.toLocaleString()) {
				return 'first';
			}
		} else {
			switch (status) {
				case DATE_STATUS.focusedFirst:
					return 'first';
				case DATE_STATUS.focusedLast:
					return 'last';
				default:
					return null;
			}
		}
		return null;
	};

	// React runs the `onMouseEnter` handlers of the entered elements from the OUTERMOST one down to the target, so the
	// `e.stopPropagation()` of the cell's handler silences everything rendered inside the cell (the Tooltip of the `renderDate`
	// story never opens). Native `mouseenter` is dispatched to each element separately: swallow (capture phase) the ones aimed at
	// descendants while the cell itself is being entered.
	const swallowDescendantEnter = (node: HTMLElement) => {
		const handler = (e: MouseEvent) => {
			if (e.target !== node && !node.contains(e.relatedTarget as Node | null)) e.stopPropagation();
		};
		node.addEventListener('mouseenter', handler, true);
		return {
			destroy() {
				node.removeEventListener('mouseenter', handler, true);
			}
		};
	};

	let calendarEl = $state<HTMLDivElement>();

	onMount(() => {
		const calendar = calendarEl;
		if (!calendar) return;
		const itemEls = Array.from(calendar.children).filter((el) => el.classList.contains('atmr-calendar__item')) as HTMLElement[];
		let firstItem: HTMLElement | null = null;
		let lastItem: HTMLElement | null = null;
		items.forEach((elem, idx) => {
			const which = getItemRef(elem.status, elem.date);
			if (which === 'first') firstItem = itemEls[idx] ?? null;
			else if (which === 'last') lastItem = itemEls[idx] ?? null;
		});
		const first = firstItem as HTMLElement | null;
		const last = lastItem as HTMLElement | null;
		if ((first?.offsetTop && last?.offsetTop) || (first?.offsetTop && !last?.offsetTop)) {
			calendar.scrollBy(0, first.offsetTop);
		}
		if (!first?.offsetTop && last?.offsetTop) {
			calendar.scrollBy(0, last.offsetTop);
		}
	});
</script>

<div {...rootAttrs} class={rootClassName} style={styleToString(rootAttrs?.style)}>
	{#if calendarMode === CALENDAR_MODE.YEARS_ONLY || calendarMode === CALENDAR_MODE.MONTHS_ONLY || calendarMode === CALENDAR_MODE.DAYS_ONLY || calendarMode === CALENDAR_MODE.DAYS_WITH_TIMES || calendarMode === CALENDAR_MODE.TIMES_ONLY}
		<!-- no header -->
	{:else if calendarMode === CALENDAR_MODE.YEARS_WITH_MONTH}
		<YearsWithMonthHeader
			{variant}
			{size}
			year={String(date.getFullYear())}
			{view}
			chevronLeft={picker.chevronLeft}
			chevronRight={picker.chevronRight}
			{nextYear}
			{prevYear}
			checkDate={checkYear}
			changeDate={changeYear}
			{changeView}
			{swap}
		/>
	{:else if calendarMode === CALENDAR_MODE.MONTHS_WITH_DAYS || calendarMode === CALENDAR_MODE.MONTHS_WITH_DAYS_TIMES}
		<MonthWithDaysHeader
			{variant}
			{size}
			{fullDate}
			month={nameOfMonths[date.getMonth()]}
			{view}
			chevronLeft={picker.chevronLeft}
			chevronRight={picker.chevronRight}
			{nextMonth}
			{prevMonth}
			checkDate={checkMonth}
			changeDate={changeYearAndMonth}
			{changeView}
			{swap}
		/>
	{:else}
		<YearsWithMonthDaysHeader
			{variant}
			{size}
			{fullDate}
			month={nameOfMonths[date.getMonth()]}
			year={String(date.getFullYear())}
			{view}
			chevronLeft={picker.chevronLeft}
			chevronRight={picker.chevronRight}
			{nextMonth}
			{prevMonth}
			{nextDay}
			{prevDay}
			checkDate={checkDayOrMonth}
			changeDate={changeYearAndMonth}
			{changeView}
			{swap}
		/>
	{/if}
	<!-- [ext, not in original] `gridKey` is a constant 0 while motion is off, so the grid is never re-created then (the original in-place update) -->
	{#key gridKey}
	<div class="atmr-calendar__calendar" bind:this={calendarEl} in:rtShift|global={gridIn()} out:rtShift={gridOut()}>
		{#if view === CALENDAR_VIEW.day}
			{#each daysOfWeek as day, idx (idx)}
				<div class="atmr-calendar__day">{day}</div>
			{/each}
		{/if}
		{#each items as elem, idx (idx)}
			<div
				class={calendarItemClassName(elem.status, !!elem.empty, isTodayItem(elem.date), elem.gradient)}
				use:softHighlight={{ enabled: m.enabled, status: elem.status, empty: !!elem.empty, explicit }}
			>
				<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
				<div
					class="atmr-calendar__inner"
					onclick={(e) => {
						e.stopPropagation();
						if (elem.status !== DATE_STATUS.disabled && !elem.empty) {
							const clicked = elem.date;
							// fix ssr issue https://git.digital.rt.ru/atomaro/ui-kit/common/-/issues/1193
							setTimeout(() => {
								picker.dateClickHandler(new Date(clicked));
							}, 0);
						}
					}}
					use:swallowDescendantEnter
					onmouseenter={(e) => {
						e.stopPropagation();
						if (!elem.empty) {
							const entered = elem.date;
							// React applies the state change of a `mouseenter` / `mouseleave` in a later task (see scheduler.ts)
							scheduleContinuous(() => viewData.handleMouseEnter(entered));
						}
					}}
					onmouseleave={(e) => {
						e.stopPropagation();
						scheduleContinuous(() => viewData.handleMouseLeave());
					}}
				>
					<span>{#if picker.renderDate}{@render picker.renderDate(elem, view)}{:else}{elem.title}{/if}</span>
				</div>
			</div>
		{/each}
	</div>
	{/key}
</div>
