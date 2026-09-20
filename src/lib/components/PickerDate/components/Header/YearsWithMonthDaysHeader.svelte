<script lang="ts">
	// Port of components/Header/components/YearsWithMonthDaysHeader.tsx
	import clsx from 'clsx';
	import ChevronLeft from '../../../../icons/24/navigation/ChevronLeft.svelte';
	import ChevronRight from '../../../../icons/24/navigation/ChevronRight.svelte';
	import Slot from '../../../../internal/Slot.svelte';
	import type { Content } from '../../../../internal/types.js';
	import { CALENDAR_VIEW, type CalendarView } from '../../constants.js';
	// [ext, not in original] author's motion extension (off by default, see src/lib/ext/README.md)
	import { useTextSwap } from '../../../../ext/calendarMotion.svelte.js';
	import type { MotionHandle, MotionProp } from '../../../../ext/motion.svelte.js';

	/** [ext, not in original] what the header needs to animate its labels (see Calendar.svelte); `undefined` = the original, static header */
	interface Swap {
		readonly m: MotionHandle;
		readonly dir: 1 | -1;
		readonly prop: MotionProp;
	}

	interface Props {
		fullDate: string;
		month: string;
		year: string;
		view: CalendarView;
		changeView: (view: CalendarView) => void;
		variant: string;
		size: string;
		chevronRight?: Content;
		chevronLeft?: Content;
		checkDate: (value: Date, isDayMode?: boolean) => boolean;
		changeDate: (value: Date) => void;
		prevDay: Date;
		nextDay: Date;
		prevMonth: Date;
		nextMonth: Date;
		swap?: Swap;
	}

	let { fullDate, month, year, view, changeView, variant, size, chevronRight, chevronLeft, checkDate, changeDate, prevDay, nextDay, prevMonth, nextMonth, swap }: Props = $props();

	let monthEl = $state<HTMLElement>();
	let yearEl = $state<HTMLElement>();
	let fullDateEl = $state<HTMLElement>();
	const swapOf = (node: () => HTMLElement | undefined, text: () => string) =>
		useTextSwap({ m: () => swap?.m, node, text, dir: () => swap?.dir, prop: () => swap?.prop });
	swapOf(() => monthEl, () => month);
	swapOf(() => yearEl, () => year);
	swapOf(() => fullDateEl, () => fullDate);

	const isActiveMonth = $derived(view === CALENDAR_VIEW.month);
	const isActiveYear = $derived(view === CALENDAR_VIEW.year);
	const rootClassName = $derived(
		clsx(
			'atmr-calendar-header',
			`atmr-calendar-header--${view}`,
			`atmr-calendar-header--${variant}`,
			`atmr-calendar-header--size-${size}`,
			isActiveMonth && 'atmr-calendar-header--active-month',
			isActiveYear && 'atmr-calendar-header--active-year'
		)
	);
</script>

<div class={rootClassName}>
	{#if view === CALENDAR_VIEW.day || view === CALENDAR_VIEW.time}
		<button
			type="button"
			disabled={!checkDate(view === CALENDAR_VIEW.time ? prevDay : prevMonth)}
			class="atmr-calendar-header__button"
			onclick={(e) => {
				e.stopPropagation();
				if (view === CALENDAR_VIEW.time) {
					changeDate(prevDay);
				} else {
					changeDate(prevMonth);
				}
			}}
		>
			{#if chevronLeft === undefined}<ChevronLeft />{:else}<Slot content={chevronLeft} />{/if}
		</button>
	{/if}
	<div class="atmr-calendar-header__container">
		{#if view === CALENDAR_VIEW.time}
			<div class="atmr-calendar-header__item atmr-calendar-header__item--fullDate" bind:this={fullDateEl}>{fullDate}</div>
		{:else}
			<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
			<div
				class="atmr-calendar-header__item atmr-calendar-header__item--month"
				bind:this={monthEl}
				onclick={(e) => {
					e.stopPropagation();
					// fix ssr issue https://git.digital.rt.ru/atomaro/ui-kit/common/-/issues/1193
					setTimeout(() => {
						changeView(CALENDAR_VIEW.month);
					}, 0);
				}}
			>{month}</div>
			<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
			<div
				class="atmr-calendar-header__item atmr-calendar-header__item--year"
				bind:this={yearEl}
				onclick={(e) => {
					e.stopPropagation();
					changeView(CALENDAR_VIEW.year);
				}}
			>{year}</div>
		{/if}
	</div>
	{#if view === CALENDAR_VIEW.day || view === CALENDAR_VIEW.time}
		<button
			type="button"
			disabled={!checkDate(view === CALENDAR_VIEW.time ? nextDay : nextMonth, view === CALENDAR_VIEW.time)}
			class="atmr-calendar-header__button"
			onclick={(e) => {
				e.stopPropagation();
				if (view === CALENDAR_VIEW.time) {
					changeDate(nextDay);
				} else {
					changeDate(nextMonth);
				}
			}}
		>
			{#if chevronRight === undefined}<ChevronRight />{:else}<Slot content={chevronRight} />{/if}
		</button>
	{/if}
</div>
