<script lang="ts">
	// Port of stories/PickerDate/Props: RenderDate
	import PickerDate from '$lib/components/PickerDate/PickerDate.svelte';
	import { MONTHS } from '$lib/components/PickerDate/constants.js';
	import type { CalendarView } from '$lib/components/PickerDate/constants.js';
	import type { CalendarItemType } from '$lib/components/PickerDate/types.js';
	import Typography from '$lib/components/Typography/Typography.svelte';

	const description = 'Пропс renderDate возвращает два аругмента – item (CalendarItemType) и view. Последний – это контекст календаря возвращаемой даты: "time" | "day" | "month" | "year". Тело функции должно содержать ReactNode элемент в котором можно использовать оба аргумента для оформления ячеек календарей';
	const activeDate = new Date('03.08.2023');
</script>

{#snippet renderDate(el: CalendarItemType, view: CalendarView)}{#if view === 'day'}{#if el.date.getDate() === 8 && el.date.getMonth() === 2}&#9829;{:else}{el.date.getDate()}{/if}{:else if view === 'month'}{MONTHS[el.date.getMonth()]}{:else if view === 'year'}{el.date.getFullYear()}{:else}{el.date.getDate()}{/if}{/snippet}

<div>
	<Typography variant="heading-h2" style={{ marginBottom: 'var(--atmr-spacing-2x)' }}>renderDate</Typography>
	<Typography variant="body-m">{description}</Typography>
	<PickerDate {activeDate} {renderDate} />
</div>
