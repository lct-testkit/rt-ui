<script lang="ts" generics="Row extends Record<string, any>">
	// EXTENSION — author's addition, NOT part of the original Rostelecom design system.
	//
	// Mobile alternative to <TableGrid>: the same rows as a list of cards (a table with 7 columns does not fit a 390 px phone).
	// The component only lays the list out (selection checkbox + tappable card + empty state); what a card shows is yours:
	//
	//   {#if bp.isMobile}
	//     <TableCards {rows} selectable selected={selected} onSelectionChange={(keys) => (selected = keys)} onRowClick={(row) => open(row.id)}>
	//       {#snippet card(row)}<Typography variant="body-m" strong>{row.name}</Typography> ...{/snippet}
	//     </TableCards>
	//   {:else}
	//     <TableGrid {columns} {rows} ... />
	//   {/if}
	//
	// Keys are strings, like the selection of TableGrid (`rowConfig.selection`), so the same `selected` state drives both views.
	// Everything is drawn with design-system tokens (`--atmr-*`), so all four themes work; styles live in ./cards.css (loaded with this component only).
	import type { Snippet } from 'svelte';
	import Checkbox from '../components/Checkbox/Checkbox/Checkbox.svelte';
	import './cards.css';

	interface Props {
		/** Rows: the same objects as for TableGrid */
		rows: Row[];
		/** Property that holds the unique key of a row (default `id`), or a function returning it */
		rowKey?: keyof Row | ((row: Row) => string | number);
		/** What one card shows */
		card: Snippet<[Row, number]>;
		/** Adds a checkbox to every card */
		selectable?: boolean;
		/** Keys of the selected rows */
		selected?: string[];
		/** Called with the new list of selected keys */
		onSelectionChange?: (keys: string[]) => void;
		/** Tap on a card (not on its checkbox) */
		onRowClick?: (row: Row) => void;
		/** Text when there are no rows */
		emptyText?: string;
		/** Accessible name of the list */
		'aria-label'?: string;
		class?: string;
	}

	let {
		rows,
		rowKey = 'id' as keyof Row,
		card,
		selectable = false,
		selected = [],
		onSelectionChange,
		onRowClick,
		emptyText = 'Ничего не найдено',
		'aria-label': ariaLabel,
		class: className
	}: Props = $props();

	const keyOf = (row: Row): string => String(typeof rowKey === 'function' ? rowKey(row) : row[rowKey]);
	const selectedSet = $derived(new Set(selected));

	function toggle(key: string, on: boolean) {
		onSelectionChange?.(on ? [...selected.filter((k) => k !== key), key] : selected.filter((k) => k !== key));
	}
	function onKey(e: KeyboardEvent, row: Row) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			onRowClick?.(row);
		}
	}
</script>

<ul class={['rt-ext-cards', className]} aria-label={ariaLabel}>
	{#each rows as row, i (keyOf(row))}
		{@const key = keyOf(row)}
		{@const isSelected = selectedSet.has(key)}
		<li class={['rt-ext-cards__item', isSelected && 'rt-ext-cards__item--selected', selectable && 'rt-ext-cards__item--selectable']}>
			{#if selectable}
				<div class="rt-ext-cards__check">
					<Checkbox variant="primary" checked={isSelected} aria-label="Выбрать" onChange={(v: boolean) => toggle(key, v)} />
				</div>
			{/if}
			<div class="rt-ext-cards__main" role={onRowClick ? 'button' : undefined} tabindex={onRowClick ? 0 : undefined}
				onclick={() => onRowClick?.(row)} onkeydown={(e) => onKey(e, row)}>
				{@render card(row, i)}
			</div>
		</li>
	{:else}
		<li class="rt-ext-cards__empty">{emptyText}</li>
	{/each}
</ul>
