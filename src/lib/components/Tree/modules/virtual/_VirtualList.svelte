<script lang="ts" module>
	// react-virtualized: `dom-helpers/scrollbarSize` (measured once)
	let measuredScrollbarSize: number | undefined;
	const getScrollbarSize = (): number => {
		if (measuredScrollbarSize === undefined && typeof document !== 'undefined') {
			const scrollDiv = document.createElement('div');
			scrollDiv.style.position = 'absolute';
			scrollDiv.style.top = '-9999px';
			scrollDiv.style.width = '50px';
			scrollDiv.style.height = '50px';
			scrollDiv.style.overflow = 'scroll';
			document.body.appendChild(scrollDiv);
			measuredScrollbarSize = scrollDiv.offsetWidth - scrollDiv.clientWidth;
			document.body.removeChild(scrollDiv);
		}
		return measuredScrollbarSize ?? 0;
	};

	// react-virtualized: `utils/requestAnimationTimeout` (a timeout driven by requestAnimationFrame that measures the elapsed time with
	// `Date.now()`; the test harness freezes `Date`, so - like in the reference - `isScrolling` never resets there)
	const requestAnimationTimeout = (callback: () => void, delay: number): { id: number } => {
		let start = 0;
		void Promise.resolve().then(() => {
			start = Date.now();
		});
		const timeout = () => {
			if (Date.now() - start >= delay) {
				callback();
			} else {
				frame.id = requestAnimationFrame(timeout);
			}
		};
		const frame = { id: requestAnimationFrame(timeout) };
		return frame;
	};

	// react-virtualized: `List` uses `accessibilityOverscanIndicesGetter` (at least one cell of overscan in both directions)
	const SCROLL_DIRECTION_BACKWARD = -1;
	const SCROLL_DIRECTION_FORWARD = 1;
	const overscanIndicesGetter = ({ cellCount, overscanCellsCount, scrollDirection, startIndex, stopIndex }: { cellCount: number; overscanCellsCount: number; scrollDirection: number; startIndex: number; stopIndex: number }) => {
		overscanCellsCount = Math.max(1, overscanCellsCount);
		if (scrollDirection === SCROLL_DIRECTION_FORWARD) {
			return { overscanStartIndex: Math.max(0, startIndex - 1), overscanStopIndex: Math.min(cellCount - 1, stopIndex + overscanCellsCount) };
		}
		return { overscanStartIndex: Math.max(0, startIndex - overscanCellsCount), overscanStopIndex: Math.min(cellCount - 1, stopIndex + 1) };
	};
</script>

<script lang="ts">
	// Port of react-virtualized 9.22.6 `List` + `Grid` (one column, `autoContainerWidth`, rows measured by `CellMeasurer` through a
	// `deferredMeasurementCache`) - the virtual list the React Tree renders with `virtualScroll.isEnable`. The reference DOM is the DOM of
	// react-virtualized, so this is a port and not a virtua list:
	//
	//   <div class="ReactVirtualized__Grid ReactVirtualized__List" role="grid" aria-label="grid" aria-readonly="true" tabindex="0" style="...; overflow: hidden auto">
	//     <div class="ReactVirtualized__Grid__innerScrollContainer" role="row" style="height: <total>; max-height: <total>; ...">
	//       ...one absolutely positioned row per index of the window (visible rows + 10 rows of overscan)...
	//
	// The window is `[start - 1, stop + 10]` while scrolling forward, `[start - 10, stop + 1]` backward (the overscan of `List` is not
	// configurable by the Tree: `virtualScroll.overscanCount` is ignored in React as well). Rows that were not measured yet count as 40px;
	// the height of the not yet measured tail of the list is estimated with 30px per row (that is what the inner container height shows).
	// The scroll-to-row props of the Grid are not used by the Tree and not ported; a list that shrinks below the scroll position scrolls to its end.
	import { onDestroy, untrack, type Snippet } from 'svelte';
	import type { CellMeasurerCache } from './CellMeasurerCache.js';
	import { ScalingCellSizeAndPositionManager } from './cellSizeAndPositionManager.js';
	import type { VirtualListApi, VirtualListCell } from './types.js';

	let {
		height,
		width,
		rowCount,
		cache,
		row
	}: {
		height: number;
		width: number;
		rowCount: number;
		/** `deferredMeasurementCache` + `rowHeight` of the list */
		cache: CellMeasurerCache;
		/** renders one row: `{#snippet row(cell, parent)}` (`cell.style` goes on the row element) */
		row: Snippet<[VirtualListCell, VirtualListApi]>;
	} = $props();

	const ESTIMATED_ROW_SIZE = 30;
	const OVERSCAN_ROW_COUNT = 10;
	const OVERSCAN_COLUMN_COUNT = 0;
	const SCROLLING_RESET_TIME_INTERVAL = 150;

	const scrollbarSize = getScrollbarSize();
	const columnManager = new ScalingCellSizeAndPositionManager({
		cellCount: 1,
		cellSizeGetter: () => untrack(() => width),
		estimatedCellSize: untrack(() => width)
	});
	const rowManager = new ScalingCellSizeAndPositionManager({
		cellCount: untrack(() => rowCount),
		cellSizeGetter: (params) => cache.rowHeight(params),
		estimatedCellSize: ESTIMATED_ROW_SIZE
	});

	let container = $state<HTMLDivElement | null>(null);
	let scrollTop = $state(0);
	let scrollDirectionVertical = $state(SCROLL_DIRECTION_FORWARD);
	let isScrolling = $state(false);
	/** bumped when the size managers were reset (React: `forceUpdate`) */
	let version = $state(0);
	let scrollPositionChangeReason: 'observed' | 'requested' | null = null;

	// instanceProps of the Grid state
	let prevRowCount = untrack(() => rowCount);
	let prevColumnWidth = untrack(() => width);
	// prevProps of componentDidUpdate
	let prevHeight = untrack(() => height);
	let prevRowCountProp = untrack(() => rowCount);

	// invalidateCellSizeAfterRender / _handleInvalidatedGridSize
	let deferredInvalidateColumnIndex: number | null = null;
	let deferredInvalidateRowIndex: number | null = null;
	let destroyed = false;

	const recomputeGridSize = ({ columnIndex = 0, rowIndex = 0 }: { columnIndex?: number; rowIndex?: number } = {}) => {
		columnManager.resetCell(columnIndex);
		rowManager.resetCell(rowIndex);
		version += 1;
	};

	const handleInvalidatedGridSize = () => {
		if (typeof deferredInvalidateColumnIndex === 'number' && typeof deferredInvalidateRowIndex === 'number') {
			const columnIndex = deferredInvalidateColumnIndex;
			const rowIndex = deferredInvalidateRowIndex;
			deferredInvalidateColumnIndex = null;
			deferredInvalidateRowIndex = null;
			recomputeGridSize({ columnIndex, rowIndex });
		}
	};

	const api: VirtualListApi = {
		invalidateCellSizeAfterRender({ columnIndex, rowIndex }) {
			deferredInvalidateColumnIndex = typeof deferredInvalidateColumnIndex === 'number' ? Math.min(deferredInvalidateColumnIndex, columnIndex) : columnIndex;
			deferredInvalidateRowIndex = typeof deferredInvalidateRowIndex === 'number' ? Math.min(deferredInvalidateRowIndex, rowIndex) : rowIndex;
			// React handles it in the componentDidUpdate of the Grid; the effects of the rows and of the list may run in either order here
			queueMicrotask(() => {
				if (!destroyed) handleInvalidatedGridSize();
			});
		}
	};

	// getDerivedStateFromProps + render + _calculateChildrenToRender
	const view = $derived.by(() => {
		void version;
		const gridHeight = height;
		const gridWidth = width;
		const count = rowCount;
		const top = scrollTop;
		const scrolling = isScrolling;
		const direction = scrollDirectionVertical;

		columnManager.configure({ cellCount: 1, estimatedCellSize: gridWidth, cellSizeGetter: () => gridWidth });
		rowManager.configure({ cellCount: count, estimatedCellSize: ESTIMATED_ROW_SIZE, cellSizeGetter: (params) => cache.rowHeight(params) });
		if (count !== prevRowCount) rowManager.resetCell(0);
		if (gridWidth !== prevColumnWidth) columnManager.resetCell(0);
		prevRowCount = count;
		prevColumnWidth = gridWidth;

		const cells: VirtualListCell[] = [];
		if (gridHeight > 0 && gridWidth > 0) {
			const visibleColumns = columnManager.getVisibleCellRange({ containerSize: gridWidth, offset: 0 });
			const visibleRows = rowManager.getVisibleCellRange({ containerSize: gridHeight, offset: top });
			const horizontalOffsetAdjustment = columnManager.getOffsetAdjustment({ containerSize: gridWidth, offset: 0 });
			const verticalOffsetAdjustment = rowManager.getOffsetAdjustment({ containerSize: gridHeight, offset: top });
			const overscanColumns = overscanIndicesGetter({
				cellCount: 1,
				overscanCellsCount: OVERSCAN_COLUMN_COUNT,
				scrollDirection: SCROLL_DIRECTION_FORWARD,
				startIndex: typeof visibleColumns.start === 'number' ? visibleColumns.start : 0,
				stopIndex: typeof visibleColumns.stop === 'number' ? visibleColumns.stop : -1
			});
			const overscanRows = overscanIndicesGetter({
				cellCount: count,
				overscanCellsCount: OVERSCAN_ROW_COUNT,
				scrollDirection: direction,
				startIndex: typeof visibleRows.start === 'number' ? visibleRows.start : 0,
				stopIndex: typeof visibleRows.stop === 'number' ? visibleRows.stop : -1
			});
			const columnStartIndex = overscanColumns.overscanStartIndex;
			let rowStartIndex = overscanRows.overscanStartIndex;
			let rowStopIndex = overscanRows.overscanStopIndex;
			if (!cache.hasFixedWidth() && !cache.has(0, columnStartIndex)) {
				rowStartIndex = 0;
				rowStopIndex = count - 1;
			}
			for (let rowIndex = rowStartIndex; rowIndex <= rowStopIndex; rowIndex++) {
				const rowDatum = rowManager.getSizeAndPositionOfCell(rowIndex);
				const columnDatum = columnManager.getSizeAndPositionOfCell(columnStartIndex);
				// rows that were not measured yet are laid out with their natural height (the cell measurer reads it); List forces `width: 100%`
				const style = !cache.has(rowIndex, columnStartIndex)
					? 'height: auto; left: 0px; position: absolute; top: 0px; width: 100%;'
					: `height: ${rowDatum.size}px; left: ${columnDatum.offset + horizontalOffsetAdjustment}px; position: absolute; top: ${rowDatum.offset + verticalOffsetAdjustment}px; width: 100%;`;
				cells.push({ index: rowIndex, style });
			}
		}

		const totalColumnsWidth = columnManager.getTotalSize();
		const totalRowsHeight = rowManager.getTotalSize();
		const verticalScrollBarSize = totalRowsHeight > gridHeight ? scrollbarSize : 0;
		const horizontalScrollBarSize = totalColumnsWidth > gridWidth ? scrollbarSize : 0;
		const overflowX = totalColumnsWidth + verticalScrollBarSize <= gridWidth ? 'hidden' : 'auto';
		const overflowY = totalRowsHeight + horizontalScrollBarSize <= gridHeight ? 'hidden' : 'auto';
		const overflow = overflowX === overflowY ? overflowX : `${overflowX} ${overflowY}`;
		return {
			cells,
			gridStyle: `box-sizing: border-box; direction: ltr; height: ${gridHeight}px; position: relative; width: ${gridWidth}px; will-change: transform; overflow: ${overflow};`,
			innerStyle: `width: auto; height: ${totalRowsHeight}px; max-width: ${totalColumnsWidth}px; max-height: ${totalRowsHeight}px; overflow: hidden;${scrolling ? ' pointer-events: none;' : ''} position: relative;`
		};
	});

	// _updateScrollTopForScrollToRow with scrollToRow = -1 (the last row)
	const updateScrollTopForScrollToRow = () => {
		const count = rowCount;
		if (count <= 0) return;
		const totalColumnsWidth = columnManager.getTotalSize();
		const scrollBarSize = totalColumnsWidth > width ? scrollbarSize : 0;
		const calculatedScrollTop = rowManager.getUpdatedOffsetForIndex({ align: 'auto', containerSize: height - scrollBarSize, currentOffset: scrollTop, targetIndex: count - 1 });
		if (calculatedScrollTop >= 0 && scrollTop !== calculatedScrollTop) {
			scrollPositionChangeReason = 'requested';
			scrollDirectionVertical = calculatedScrollTop > scrollTop ? SCROLL_DIRECTION_FORWARD : SCROLL_DIRECTION_BACKWARD;
			scrollTop = calculatedScrollTop;
		}
	};

	// componentDidMount + componentDidUpdate
	const didUpdate = () => {
		handleInvalidatedGridSize();
		const el = container;
		const countJustIncreasedFromZero = rowCount > 0 && prevRowCountProp === 0;
		if (scrollPositionChangeReason === 'requested' && el) {
			if (scrollTop >= 0 && (scrollTop !== el.scrollTop || countJustIncreasedFromZero)) {
				el.scrollTop = scrollTop;
			}
		}
		// updateScrollIndexHelper: the list got smaller (fewer rows / less height) -> keep the last row visible
		if (rowCount > 0 && (height < prevHeight || rowCount < prevRowCountProp)) {
			if (scrollTop > rowManager.getTotalSize() - height) {
				updateScrollTopForScrollToRow();
			}
		}
		prevHeight = height;
		prevRowCountProp = rowCount;
	};

	$effect(() => {
		void view;
		untrack(didUpdate);
	});

	// scrolling
	let scrollTimeout: { id: number } | null = null;
	const debounceScrollEnded = () => {
		if (scrollTimeout) cancelAnimationFrame(scrollTimeout.id);
		scrollTimeout = requestAnimationTimeout(() => {
			scrollTimeout = null;
			isScrolling = false;
		}, SCROLLING_RESET_TIME_INTERVAL);
	};

	const onScroll = (event: Event) => {
		if (event.target !== container) return;
		const scrollTopParam = (event.target as HTMLElement).scrollTop || 0;
		if (scrollTopParam < 0) return;
		debounceScrollEnded();
		const totalRowsHeight = rowManager.getTotalSize();
		const newScrollTop = Math.min(Math.max(0, totalRowsHeight - height + scrollbarSize), scrollTopParam);
		if (scrollTop !== newScrollTop) {
			scrollDirectionVertical = newScrollTop > scrollTop ? SCROLL_DIRECTION_FORWARD : SCROLL_DIRECTION_BACKWARD;
			scrollTop = newScrollTop;
			isScrolling = true;
			scrollPositionChangeReason = 'observed';
		}
	};

	onDestroy(() => {
		destroyed = true;
		if (scrollTimeout) cancelAnimationFrame(scrollTimeout.id);
	});
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
<div bind:this={container} aria-label="grid" aria-readonly="true" class="ReactVirtualized__Grid ReactVirtualized__List" role="grid" style={view.gridStyle} tabindex="0" onscroll={onScroll}>
	{#if view.cells.length > 0}
		<div class="ReactVirtualized__Grid__innerScrollContainer" role="row" style={view.innerStyle}>
			{#each view.cells as cell (cell.index)}
				{@render row(cell, api)}
			{/each}
		</div>
	{/if}
</div>
