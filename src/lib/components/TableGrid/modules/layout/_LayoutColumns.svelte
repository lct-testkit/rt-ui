<script lang="ts">
	// Port of shared/modules/layout/components/LayoutColumns.tsx: `div.atmr-tablegrid__columns__container` = the addon cell
	// (expand / selection controls, or the header's first column) + one cell per column: the header cell for the header row
	// (`header`), the content cell for data rows.
	//
	// PERFORMANCE: instantiated once per row. Data rows iterate over the column NAMES (strings), the cell reads its column from the
	// shared `layout.cellMeta`; there is no dynamic component and no per-row `clsx` (the addon class is computed once in the layout).
	import type { Snippet } from 'svelte';
	import Slot from '../../../../internal/Slot.svelte';
	import ContentCell from '../cell/_ContentCell.svelte';
	import { useConfig, useConfigEnabledModes } from '../config/config.svelte.js';
	import HeaderCell from '../header/_HeaderCell.svelte';
	import { useLayout } from './layout.svelte.js';
	import { useRows } from '../rows/rows.svelte.js';
	import { useRow } from '../row/row.svelte.js';

	interface Props {
		/** header row: the addon cell shows the "select all" header instead of the row controls */
		header?: boolean;
		/** content of the addon cell (row controls: expand button, selection checkbox) */
		children?: Snippet;
	}

	let { header = false, children }: Props = $props();

	const cfg = useConfig();
	const layout = useLayout();
	const modes = useConfigEnabledModes();
	const rows = useRows();
	const rowContext = useRow();
	// (the highlighted row also colours the addon cell when `highlightOnClick` is off - React does the same)
	const highlighted = $derived(!header && rows.highlighted === rowContext().id);

	// React updates every changed custom property separately (`style.setProperty`), so do we (`style:` directives)
	const selectedBackground = 'var(--atmr-tablegrid-primary-row-bg-color-selected)';
	const rowBackground = $derived(
		header ? undefined : highlighted ? (rowContext().highlightColor ?? selectedBackground) : (rowContext().backgroundColor ?? 'var(--atmr-tablegrid-primary-row-bg-color-default)')
	);
	const addonStickyBackground = $derived(
		header ? undefined : highlighted ? (rowContext().highlightColor ?? selectedBackground) : (rowContext().backgroundColor ?? 'var(--atmr-tablegrid-primary-bg-color)')
	);
</script>

<div class="atmr-tablegrid__columns__container" data-columns-table-id={layout.tableId}>
	{#if layout.isShowAddonColumn}
		<div
			class={header ? layout.addonClass.header : layout.addonClass.row}
			role="cell"
			style:--column-index={1}
			style:--background-row={rowBackground || undefined}
			style:--addon-sticky-bg={addonStickyBackground || undefined}
		>
			{#if header}
				{#if modes.isSelectionModeEnabled && modes.isExpandableModeEnabled}
					<div class="atmr-tablegrid__addon__controls atmr-tablegrid__addon__controls--combined">
						<div class="atmr-tablegrid__expand__icon atmr-tablegrid__expand__icon--placeholder" aria-hidden="true"></div>
						<div class="atmr-tablegrid__checktree__container"><Slot content={cfg.config.rowConfig?.selection?.renderFirstColumnHeader} /></div>
					</div>
				{:else if modes.isSelectionModeEnabled}
					<Slot content={cfg.config.rowConfig?.selection?.renderFirstColumnHeader} />
				{:else}
					{@render children?.()}
				{/if}
			{:else if modes.isSelectionModeEnabled && modes.isExpandableModeEnabled}
				<div class="atmr-tablegrid__addon__controls atmr-tablegrid__addon__controls--combined">{@render children?.()}</div>
			{:else}
				{@render children?.()}
			{/if}
		</div>
	{/if}
	{#if header}
		{#each layout.columns as column (column.name)}
			<HeaderCell {column} />
		{/each}
	{:else}
		{#each layout.columnNames as name (name)}
			<ContentCell {name} />
		{/each}
	{/if}
</div>
