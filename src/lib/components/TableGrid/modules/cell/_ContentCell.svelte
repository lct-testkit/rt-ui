<script lang="ts">
	// Port of TableGrid/modules/renders/ContentCell.tsx: one body cell (`div.atmr-tablegrid__cell`).
	// Content = `column.render(row)` (a snippet that receives the row) or `row[column.key ?? column.name]`
	// (an object value `{ content, warning, error }` shows its `content`, `warning` / `error` mark the cell).
	//
	// PERFORMANCE: this component is instantiated rows x columns times (8000 for 1000 x 8), so it does as little as possible:
	//   * everything that depends on the COLUMN only (class, style, data key, `render`) comes from the shared `layout.cellMeta`
	//     (computed once per column); the cell receives the column NAME, so replacing the column objects does not re-run 8000 cells;
	//   * no event handlers here: `mouseenter` (column hover) / `dragover` / `drop` (column move) are delegated to the grid root
	//     (`../layout/_Layout.svelte`), that was 3 `addEventListener` calls per cell;
	//   * no `clsx`, no `Slot` component (its `{#if}` is inlined), no per-cell context lookups except the layout and the row.
	import { useLayout } from '../layout/layout.svelte.js';
	import { useRow } from '../row/row.svelte.js';

	let { name }: { name: string } = $props();

	const layout = useLayout();
	const rowContext = useRow();

	const EMPTY: Record<string, any> = {};

	const meta = $derived(layout.cellMeta.get(name));
	const value = $derived((rowContext().data ?? EMPTY)[meta?.key ?? name]);
	// React renders nothing for booleans
	const content = $derived.by(() => {
		const node = value?.content ?? value;
		return typeof node === 'boolean' ? null : node;
	});
	// `warning` / `error` are the only per-cell classes: they sit between the column classes (`pre`) and the align classes (`post`)
	const cellClass = (): string =>
		value?.warning || value?.error
			? (meta?.pre ?? 'atmr-tablegrid__cell') + (value.warning ? ' atmr-tablegrid__cell--warning' : '') + (value.error ? ' atmr-tablegrid__cell--error' : '') + (meta?.post ?? '')
			: (meta?.className ?? 'atmr-tablegrid__cell');
</script>

<div class={cellClass()} role="cell" style={meta?.style} data-table-cell-name={name} data-cell-table-id={layout.tableId}>
	{#if meta?.render}{@render meta.render((rowContext().data ?? EMPTY) as never)}{:else if typeof content === 'function'}{@render content()}{:else if content !== null && content !== undefined && content !== false}{content}{/if}
</div>
