<script lang="ts">
	// Virtual rows of the TableGrid (`virtual: { isEnable: true, overscanCount }`): only the rows that are visible (+ overscan) are in the DOM.
	//
	// WHY NOT `VList`: a TableGrid is ONE css grid (`.atmr-tablegrid__layout`: the header cells, the addon column, the sticky header / footer,
	// column resize / move all live in the same grid tracks; rows are `display: contents`, cells are placed by `--column-index`). A list
	// that wraps every row in an absolutely positioned box breaks that (the cells of a row stack up in a block, the columns do not line
	// up with the header). So the window is rendered INTO the grid, with CSS SUBGRID (Chrome 117+, Safari 16+, Firefox 71+):
	//
	//   .atmr-tablegrid__layout (grid)
	//     header row                                      explicit grid row 2
	//     .window   grid-row 3, columns: subgrid          padding-top / padding-bottom stand in for the rows that are not rendered
	//       .vrow   columns: subgrid, rows: auto          one per rendered row; measured; holds the row and its expand container
	//         div.atmr-tablegrid__row (contents) -> cells, placed in the vrow by `--column-index` and auto-placement (no `--row-index`)
	//     footer
	//
	//   * columns of every row are the columns of the layout (the same tracks as the header) - resize / move / sticky columns keep working;
	//     an `auto` column is sized by the rendered rows only, give the columns of a virtual table a width;
	//   * no `--row-index` is written: scrolling inserts / removes ONE row at an edge and rewrites two paddings (no re-numbering of the window);
	//   * `:nth-last-child(-n + 2)` (bottom corners of the last row, see the stylesheet) must not match the header row: a hidden element
	//     after the window keeps the header out of the last two children; the corners of the last row are restored by the style block below;
	//   * every row lives in its own `.vrow`, so inserting / removing a row does not invalidate its siblings' `:nth-last-child(-n + 2)`
	//     style rules of the stylesheet (with the rows as direct children of the grid every scroll step re-styled the whole window);
	//   * row sizes are measured (variable heights, expanded rows, wrapped text) by a ResizeObserver on the `.vrow`;
	//     virtua's core (`virtua/unstable_core`: the store behind `VList`) keeps the sizes, the scroll offset, the visible range and
	//     compensates the scroll position when rows above the viewport change their size;
	//   * the scroller is `.atmr-tablegrid__layout` when the table has a height (`containerStyle={{ maxHeight: 600 }}`, `style` - the same rule as
	//     the sticky header offset, see ../sticky/offsets.ts); otherwise the nearest ancestor that scrolls (an app shell with `overflow: auto`,
	//     found once at mount: the padding of the window makes the content taller than a height-limited ancestor), otherwise the PAGE
	//     (virtua's window scroller).
	import { onMount, untrack, type Snippet } from 'svelte';
	import {
		ACTION_ITEMS_LENGTH_CHANGE,
		ACTION_START_OFFSET_CHANGE,
		UPDATE_VIRTUAL_STATE,
		createResizer,
		createScroller,
		createVirtualStore,
		createWindowResizer,
		createWindowScroller
	} from 'virtua/unstable_core';
	import { START_ROW_POSITION } from '../../constants.js';
	import { hasScrollConstraint } from '../../utils.js';
	import { useConfig } from '../config/config.svelte.js';
	import ExpandContainer from '../expand/_ExpandContainer.svelte';
	import RowProvider from '../row/_RowProvider.svelte';
	import type { RowState } from '../row/row.svelte.js';
	import { useRows } from '../rows/rows.svelte.js';

	let { children }: { children?: Snippet } = $props();

	const rows = useRows();
	const cfg = useConfig();

	/** row height until it is measured (px); `shouldAutoEstimateItemSize` replaces it by the median of the measured ones */
	const ESTIMATED_ROW_HEIGHT = 41;
	/** rows rendered before the viewport is known (the first frame) */
	const INITIAL_ROWS = 25;

	const store = createVirtualStore(rows.rows.length, ESTIMATED_ROW_HEIGHT, rows.virtual?.overscanCount ?? 4, Math.min(rows.rows.length, INITIAL_ROWS), undefined, true);
	// the table scrolls itself when its height is limited (`containerStyle` / `style`)
	const ownScroll = untrack(() => hasScrollConstraint(cfg.config.containerStyle) || hasScrollConstraint(cfg.config.style));
	// the observer of the rows is the same for every kind of scroller; the scroller / root observer of an element or of the page is chosen at mount
	const resizer = createResizer(store, false);
	let scroller: { $fixScrollJump(): void } | undefined;

	let version = $state.raw(store.$getStateVersion());
	const unsubscribe = store.$subscribe(UPDATE_VIRTUAL_STATE, () => {
		version = store.$getStateVersion();
	});

	let windowElement = $state<HTMLDivElement>();

	// the number of rows follows `rows` (the store keeps the measured sizes)
	$effect.pre(() => {
		const length = rows.rows.length;
		if (length !== store.$getItemsLength()) store.$update(ACTION_ITEMS_LENGTH_CHANGE, [length, false]);
	});

	/** the nearest ancestor (starting with `start`) that scrolls: `overflow-y: auto | scroll` and taller content than box; `null` = the page */
	const scrollParentOf = (start: HTMLElement): HTMLElement | null => {
		for (let el: HTMLElement | null = start; el && el !== document.body && el !== document.documentElement; el = el.parentElement) {
			const { overflowY } = getComputedStyle(el);
			if ((overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') && el.scrollHeight > el.clientHeight + 1) return el;
		}
		return null;
	};

	onMount(() => {
		const layout = windowElement?.closest<HTMLElement>('.atmr-tablegrid__layout');
		if (!layout || !windowElement) return;
		const scrollElement = ownScroll ? layout : scrollParentOf(layout);

		if (!scrollElement) {
			// the page scrolls: virtua's window scroller measures the offset of the list itself
			const windowResizer = createWindowResizer(store, false);
			const windowScroller = createWindowScroller(store, false);
			windowResizer.$observeRoot(windowElement);
			windowScroller.$observe(windowElement);
			scroller = windowScroller;
			return () => {
				unsubscribe();
				windowResizer.$dispose();
				windowScroller.$dispose();
				resizer.$dispose();
			};
		}

		const elementScroller = createScroller(store, false);
		resizer.$observeRoot(scrollElement);
		elementScroller.$observe(scrollElement);
		scroller = elementScroller;

		// distance between the top of the scrolled content and the first row = the header (the store measures the rows from the list start)
		const measureStart = () => {
			if (!windowElement) return;
			const start = windowElement.getBoundingClientRect().top - scrollElement.getBoundingClientRect().top - scrollElement.clientTop + scrollElement.scrollTop;
			const margin = Math.max(0, Math.round(start));
			if (margin !== store.$getStartSpacerSize()) store.$update(ACTION_START_OFFSET_CHANGE, margin);
		};
		// (no explicit first call: `observe()` reports every observed element once after the first layout, in the frame that is painted -
		// a synchronous measure here would force the layout of the whole page in the middle of the mount)
		// the header can change its height (wrapped titles, inline filters): watch the header underlay and the scroller
		const observer = new ResizeObserver(measureStart);
		observer.observe(scrollElement);
		const underlay = layout.querySelector('.atmr-tablegrid__header-underlay');
		if (underlay) observer.observe(underlay);
		return () => {
			observer.disconnect();
			unsubscribe();
			resizer.$dispose();
			elementScroller.$dispose();
		};
	});

	// after every change of the virtual state (rows swapped, sizes measured) the scroll offset is compensated for the size changes above the viewport
	let fixedVersion: unknown;
	$effect(() => {
		if (fixedVersion === version) return;
		fixedVersion = version;
		scroller?.$fixScrollJump();
	});

	// --- the window ---------------------------------------------------------------------------------------------------------------
	interface WindowItem {
		index: number;
		row: RowState;
	}
	interface WindowState {
		items: WindowItem[];
		/** height of the rows above / below the window */
		top: number;
		bottom: number;
	}
	const EMPTY: WindowState = { items: [], top: 0, bottom: 0 };

	const windowState = $derived.by<WindowState>(() => {
		void version;
		const all = rows.rows;
		if (!all.length) return EMPTY;
		const [start, end] = store.$getRange();
		const last = Math.min(end, all.length - 1);
		const items: WindowItem[] = [];
		for (let index = start; index <= last; index++) items.push({ index, row: all[index]! });
		return {
			items,
			top: store.$getItemOffset(start),
			bottom: Math.max(0, store.$getTotalSize() - store.$getItemOffset(last) - store.$getItemSize(last))
		};
	});

	/** reports the height of a rendered row (`.vrow`: the row + its expand container) to the virtualizer */
	const measure = (node: HTMLElement, index: number) => {
		let cleanup = resizer.$observeItem(node, index);
		return {
			update(next: number) {
				if (next === index) return;
				cleanup();
				cleanup = resizer.$observeItem(node, (index = next));
			},
			destroy() {
				cleanup();
			}
		};
	};
</script>

<!-- `overflow-anchor: none`: the browser must not "anchor" the scroll position to a row, the virtualizer compensates the size changes itself -->
<div
	bind:this={windowElement}
	class="atmr-tablegrid__virtual-window"
	style="grid-row: {START_ROW_POSITION}; grid-column: 1 / -1; display: grid; grid-template-columns: subgrid; overflow-anchor: none; padding: {windowState.top}px 0 {windowState.bottom}px"
>
	{#each windowState.items as item (item.row.key ?? item.row.id)}
		<div class="atmr-tablegrid__virtual-row" style="grid-column: 1 / -1; display: grid; grid-template-columns: subgrid; --row-index: auto" use:measure={item.index}>
			<RowProvider row={item.row}>{@render children?.()}</RowProvider>
			{#if item.row.isExpandable}
				<RowProvider row={item.row}><ExpandContainer /></RowProvider>
			{/if}
		</div>
	{/each}
</div>
<div class="atmr-tablegrid__virtual-end" style="display: none" aria-hidden="true"></div>

<style>
	/* bottom corners of the last row (the stylesheet only knows rows that are direct children of the grid) */
	:global(.atmr-tablegrid.atmr-tablegrid--withBorders:not(.atmr-tablegrid--empty):not(.atmr-tablegrid--nested) > .atmr-tablegrid__layout > .atmr-tablegrid__virtual-window .atmr-tablegrid__row--last > .atmr-tablegrid__columns__container > .atmr-tablegrid__cell:first-child) {
		border-bottom-left-radius: 7px;
	}
	:global(.atmr-tablegrid.atmr-tablegrid--withBorders:not(.atmr-tablegrid--empty):not(.atmr-tablegrid--nested) > .atmr-tablegrid__layout > .atmr-tablegrid__virtual-window .atmr-tablegrid__row--last > .atmr-tablegrid__columns__container > .atmr-tablegrid__cell:last-child) {
		border-bottom-right-radius: 7px;
	}
</style>
