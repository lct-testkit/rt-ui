<script lang="ts">
	// Port of components/Header/components/YearsWithMonthHeader.tsx
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
		year: string;
		view: CalendarView;
		changeView: (view: CalendarView) => void;
		size: string;
		variant: string;
		chevronRight?: Content;
		chevronLeft?: Content;
		nextYear: Date;
		prevYear: Date;
		checkDate: (value: Date) => boolean;
		changeDate: (value: Date) => void;
		swap?: Swap;
	}

	let { year, view, changeView, size, variant, chevronRight, chevronLeft, nextYear, prevYear, checkDate, changeDate, swap }: Props = $props();

	let yearEl = $state<HTMLElement>();
	useTextSwap({ m: () => swap?.m, node: () => yearEl, text: () => year, dir: () => swap?.dir, prop: () => swap?.prop });

	const isActiveYear = $derived(view === CALENDAR_VIEW.year);
	const rootClassName = $derived(
		clsx('atmr-calendar-header', `atmr-calendar-header--${view}`, `atmr-calendar-header--${variant}`, `atmr-calendar-header--size-${size}`, isActiveYear && 'atmr-calendar-header--active-year')
	);
</script>

<div class={rootClassName}>
	{#if view === CALENDAR_VIEW.month}
		<button
			type="button"
			class="atmr-calendar-header__button"
			disabled={!checkDate(prevYear)}
			onclick={(e) => {
				if (!checkDate(prevYear)) return;
				e.stopPropagation();
				changeDate(prevYear);
			}}
		>
			{#if chevronLeft === undefined}<ChevronLeft />{:else}<Slot content={chevronLeft} />{/if}
		</button>
	{/if}
	<div class="atmr-calendar-header__container">
		<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
		<div
			class="atmr-calendar-header__item atmr-calendar-header__item--year"
			bind:this={yearEl}
			onclick={(e) => {
				e.stopPropagation();
				// fix ssr issue https://git.digital.rt.ru/atomaro/ui-kit/common/-/issues/1193
				setTimeout(() => {
					changeView(CALENDAR_VIEW.year);
				}, 0);
			}}
		>{year}</div>
	</div>
	{#if view === CALENDAR_VIEW.month}
		<button
			type="button"
			class="atmr-calendar-header__button"
			disabled={!checkDate(nextYear)}
			onclick={(e) => {
				if (!checkDate(nextYear)) return;
				e.stopPropagation();
				changeDate(nextYear);
			}}
		>
			{#if chevronRight === undefined}<ChevronRight />{:else}<Slot content={chevronRight} />{/if}
		</button>
	{/if}
</div>
