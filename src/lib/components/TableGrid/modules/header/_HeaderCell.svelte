<script lang="ts">
	// Port of TableGrid/modules/renders/HeaderCell.tsx: one header cell (`div.atmr-tablegrid__cell--header`):
	//   resize handle (columnConfig.resize) | grip (columnConfig.move) | headline (title + unit) | buttons: filter (popover) + sort
	//   | inline filter. Hovering it prepares the resize / highlights the column.
	import clsx from 'clsx';
	import Slot from '../../../../internal/Slot.svelte';
	import type { TableGridColumn } from '../../types.js';
	import { getColumnCssKey } from '../../utils.js';
	import { useConfig, useConfigEnabledModes } from '../config/config.svelte.js';
	import DndButton from '../dnd/_DndButton.svelte';
	import { useDndController } from '../dnd/dnd.svelte.js';
	import ColumnFilter from '../filter/_ColumnFilter.svelte';
	import { useFilterController } from '../filter/filter.svelte.js';
	import { useLayout, useLayoutActions } from '../layout/layout.svelte.js';
	import ResizableBlock from '../resize/_ResizableBlock.svelte';
	import { useResizeController } from '../resize/resize.svelte.js';
	import SortingButton from '../sorting/_SortingButton.svelte';
	import { useSortingController } from '../sorting/sorting.svelte.js';

	let { column }: { column: TableGridColumn } = $props();

	const cfg = useConfig();
	const modes = useConfigEnabledModes();
	const layout = useLayout();
	const resize = useResizeController();
	const dnd = useDndController();
	const { highlitingColumn } = useLayoutActions();

	const key = $derived(column.name);
	const align = $derived(column.align ?? 'left');
	const filterController = useFilterController(() => key);
	const sortingController = useSortingController(() => key);
	const filter = $derived(filterController.filter);
	const sorting = $derived(sortingController.sorting);
	const headerSticky = $derived(cfg.config.headerSticky ?? false);

	const isInlineFilter = $derived(modes.isFilterModeEnabled && filter?.position === 'inline');

	const onMouseEnter = (e: MouseEvent) => {
		if (modes.isResizeModeEnabled && !resize.isResizing) {
			resize.onResizePrepare(e);
			return;
		}
		if (modes.isDndModeEnabled && dnd.isMoving) return;
		highlitingColumn(key, 'hover');
	};

	const cellClassName = $derived(
		clsx('atmr-tablegrid__cell', {
			'atmr-tablegrid__cell--header': true,
			'atmr-tablegrid__cell--addon': true,
			'atmr-tablegrid__cell--draggable': modes.isDndModeEnabled,
			'atmr-tablegrid__cell--stickyPosition-right': column.stickyEnd,
			'atmr-tablegrid__cell--sticky': headerSticky,
			'atmr-tablegrid__cell--align-left': align === 'left',
			'atmr-tablegrid__cell--align-right': align === 'right',
			'atmr-tablegrid__cell--text-wrap': column.textWrap ?? false
		})
	);
	const cellFilterContainerClassName = $derived(
		clsx('atmr-tablegrid__cell__filter__container', {
			'atmr-tablegrid__cell__filter__container--inline': filter?.position === 'inline',
			'atmr-tablegrid__cell__filter__container--align-left': align === 'left',
			'atmr-tablegrid__cell__filter__container--align-right': align === 'right'
		})
	);
</script>

<!-- svelte-ignore a11y_interactive_supports_focus -->
<div
	class={cellClassName}
	role="cell"
	style="--column-index: var(--column-{getColumnCssKey(key)})"
	data-header-cell-name={key}
	data-table-cell-name={key}
	data-cell-table-id={layout.tableId}
	draggable={modes.isDndModeEnabled}
	onmouseenter={onMouseEnter}
	ondragstart={dnd.onDragEnter}
	ondragover={dnd.onDragMove}
	ondrop={dnd.onDragComplete}
>
	{#if modes.isResizeModeEnabled}<ResizableBlock />{/if}
	{#if modes.isDndModeEnabled && filter?.position !== 'inline'}<DndButton />{/if}
	<ColumnFilter colKey={key}>
		{#snippet children(buttons)}
			{@const hasButtons = (modes.isSortingModeEnabled && sorting) || (modes.isFilterModeEnabled && filter?.position !== 'inline' && buttons)}
			<div class={cellFilterContainerClassName}>
				<div class="atmr-tablegrid__cell__filter__content">
					<div class="atmr-tablegrid__cell__headline">
						<span class="atmr-tablegrid__cell__headline__text"><Slot content={column.title} /></span>
						{#if column.unit}<div class="atmr-tablegrid__cell__unit"><Slot content={column.unit} /></div>{/if}
					</div>
					{#if hasButtons}
						<div class="atmr-tablegrid__cell__buttons__container">
							{#if !isInlineFilter && buttons}{@render buttons()}{/if}
							{#if modes.isSortingModeEnabled && sorting}<SortingButton id={key} />{/if}
						</div>
					{/if}
					{#if modes.isDndModeEnabled && isInlineFilter}<DndButton />{/if}
				</div>
				{#if isInlineFilter}
					<div class="atmr-tablegrid__cell__filter__inline__container">{#if buttons}{@render buttons()}{/if}</div>
				{/if}
			</div>
		{/snippet}
	</ColumnFilter>
</div>
