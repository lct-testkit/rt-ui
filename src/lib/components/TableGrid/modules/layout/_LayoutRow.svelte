<script lang="ts">
	// Port of shared/modules/layout/components/LayoutRow.tsx: `div.atmr-tablegrid__row` (a `display: contents` grid row) + its background.
	// Used for the header row and for every data row; colours / click handler come from the row context (`useRow()`).
	//
	// PERFORMANCE: instantiated once per row - no rest-props spread (that forces the slow generic attribute path), no `clsx` /
	// `styleToString` (the class and the style are plain string templates that produce exactly the same strings).
	import type { Snippet } from 'svelte';
	import { tableRowOut, useTableMotion } from '../../../../ext/tableMotion.svelte.js';
	import { noop } from '../../../../utils/noop.js';
	import { useRow } from '../row/row.svelte.js';

	interface Props {
		/** CSS grid row (`--row-index`) */
		position?: number;
		isHighlighted?: boolean;
		children?: Snippet;
	}

	let { position, isHighlighted = false, children }: Props = $props();

	const rowContext = useRow();
	const row = $derived(rowContext());
	// [ext, not in original] `out:tableRowOut` keeps a removed data row in the DOM while its cells fade (zero-length unless `motion` is on for the table)
	const motion = useTableMotion();
	// `atmr-tablegrid__row`, `--highlighted`, `--last` (what `clsx` produced)
	const rowClassName = $derived(
		isHighlighted ? (row.isLastElement ? 'atmr-tablegrid__row atmr-tablegrid__row--highlighted atmr-tablegrid__row--last' : 'atmr-tablegrid__row atmr-tablegrid__row--highlighted') : row.isLastElement ? 'atmr-tablegrid__row atmr-tablegrid__row--last' : 'atmr-tablegrid__row'
	);
	// `styleToString({ '--row-index': position, '--background-row': ..., '--border-bottom': ... })` (empty values are skipped)
	const rowStyle = $derived.by(() => {
		const background = isHighlighted ? (row.highlightColor ?? 'var(--atmr-tablegrid-primary-row-bg-color-selected)') : (row.backgroundColor ?? 'var(--atmr-tablegrid-primary-row-bg-color-default)');
		const border = row.borderBottom ?? '1px solid var(--atmr-tablegrid-primary-check-tree-border-color)';
		if (position !== undefined && position !== null && background !== '' && border !== '') return `--row-index: ${position}; --background-row: ${background}; --border-bottom: ${border};`;
		const parts: string[] = [];
		if (position !== undefined && position !== null) parts.push(`--row-index: ${position};`);
		if (background !== '') parts.push(`--background-row: ${background};`);
		if (border !== '') parts.push(`--border-bottom: ${border};`);
		return parts.length ? parts.join(' ') : undefined;
	});
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div class={rowClassName} tabindex="0" onkeydown={noop} role="row" style={rowStyle} data-table-row="true" onclick={row.onClick} ondblclick={row.onDoubleClick} out:tableRowOut={row.id === undefined ? undefined : motion}>
	{@render children?.()}
	<div class="atmr-tablegrid__row__background"></div>
</div>
