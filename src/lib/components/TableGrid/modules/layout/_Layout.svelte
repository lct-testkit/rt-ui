<script lang="ts">
	// Port of shared/modules/layout/components/Layout.tsx + TableGrid/modules/header/hooks/useBindHeaderEvents.ts:
	// `div.atmr-tablegrid__layout` - the CSS grid that holds every row of the table (its inline style carries the grid template
	// and the `--column-<name>` variables) and the scroll container (`containerStyle` = width / max-height / overflow ...).
	//
	//   * mouse handlers of the column resize flow (move -> resize, leave / up -> finish);
	//   * `atmr-tablegrid__cell--move` on the cells of the column that is a drop target while a column is dragged;
	//   * `atmr-tablegrid__cell--column-hover` on the body cells of the column whose header is hovered (plain DOM class toggling,
	//     restricted to the cells of THIS table: nested tables live inside the same DOM subtree);
	//   * the per-cell listeners of React's ContentCell (`onMouseEnter` = column hover, `onDragOver` / `onDrop` = column move) are
	//     DELEGATED here: one listener on the grid root instead of 3 x rows x columns `addEventListener` calls.
	import type { Snippet } from 'svelte';
	import { useTableMotion } from '../../../../ext/tableMotion.svelte.js';
	import { styleToString, type StyleValue } from '../../../../utils/style.js';
	import { useConfigEnabledModes } from '../config/config.svelte.js';
	import { useDndController } from '../dnd/dnd.svelte.js';
	import { useExpand } from '../expand/expand.svelte.js';
	import { useResizeController } from '../resize/resize.svelte.js';
	import { useRows } from '../rows/rows.svelte.js';
	import { useSorting } from '../sorting/sorting.svelte.js';
	import { useLayout, useLayoutActions } from './layout.svelte.js';

	let { id, style, children }: { id?: string; style?: StyleValue; children?: Snippet } = $props();

	const layout = useLayout();
	const modes = useConfigEnabledModes();
	const resize = useResizeController();
	const dnd = useDndController();
	const { resetHighliting, highlitingColumn } = useLayoutActions();

	let root = $state<HTMLDivElement>();

	// [ext, not in original] the motion of the table (src/lib/ext/tableMotion.svelte.ts) measures the grid before / after every update of the rows; it does
	// nothing (two effects that read one flag) unless `motion` is on for the table
	const motion = useTableMotion();
	if (motion) {
		const rows = useRows();
		const expand = useExpand();
		const sorting = useSorting();
		motion.track({
			root: () => root,
			rows: () => rows.rows,
			highlighted: () => rows.highlighted,
			expanded: () => expand.expandedRows,
			sortings: () => sorting.sortings
		});
	}

	const layoutStyle = $derived(
		styleToString(
			{ '--template-columns': layout.styles.template },
			layout.styles.addonControlSlots != null ? { '--addon-control-slots': layout.styles.addonControlSlots, '--addon-offset': layout.styles.addonOffset } : {},
			layout.styles.columns,
			style
		)
	);

	const onMouseMove = (e: MouseEvent) => {
		if (modes.isResizeModeEnabled && resize.isResizing) resize.onResizeUpdate(e);
	};
	const onMouseLeave = (e: MouseEvent) => {
		if (modes.isResizeModeEnabled && resize.isResizing) resize.onResizeDestroy(e);
		resetHighliting();
	};
	const onMouseUp = (e: MouseEvent) => {
		if (resize.isResizing) resize.onResizeDestroy(e);
	};

	const isOwnTableCell = (cell: Element, tableRoot: Element) => cell.closest('[data-table-root]') === tableRoot;

	// ContentCell listeners, delegated. A React per-cell listener sees the event of every body cell that contains the target (a nested
	// table may sit inside a cell), innermost first; `bodyCellsOf` returns exactly those cells of THIS table.
	const BODY_CELL = '.atmr-tablegrid__cell[data-cell-table-id]:not(.atmr-tablegrid__cell--header)';
	const bodyCellsOf = (target: EventTarget | null): HTMLElement[] => {
		const cells: HTMLElement[] = [];
		const el = root;
		if (!el) return cells;
		for (let cell = (target as Element | null)?.closest?.(BODY_CELL) ?? null; cell; cell = cell.parentElement?.closest(BODY_CELL) ?? null) {
			if (isOwnTableCell(cell, el)) cells.push(cell as HTMLElement);
		}
		return cells;
	};
	// `mouseenter` of a cell = `mouseover` whose related target is outside of the cell
	const onCellsMouseOver = (e: MouseEvent) => {
		for (const cell of bodyCellsOf(e.target)) {
			if (cell.contains(e.relatedTarget as Node | null)) continue;
			if (modes.isDndModeEnabled && dnd.isMoving) continue;
			if (modes.isResizeModeEnabled && resize.isResizing) continue;
			highlitingColumn(cell.getAttribute('data-table-cell-name') ?? '', 'hover');
		}
	};
	const onCellsDragOver = (e: DragEvent) => {
		for (const cell of bodyCellsOf(e.target)) dnd.onDragMove(e, cell);
	};
	const onCellsDrop = (e: DragEvent) => {
		for (const cell of bodyCellsOf(e.target)) dnd.onDragComplete(e, cell);
	};

	// dragged column: mark the target column's cells (a plain hover highlight does not touch the DOM: no full-table query on every mouse move)
	let hadMoveHighlight = false;
	$effect(() => {
		const el = root;
		const highlighted = layout.highlitedColumnsByKey;
		if (!el) return;
		const hasMove = Object.values(highlighted).includes('move');
		if (!hasMove && !hadMoveHighlight) return;
		hadMoveHighlight = hasMove;
		el.querySelectorAll('.atmr-tablegrid__cell--move').forEach((cell) => {
			if (isOwnTableCell(cell, el)) cell.classList.remove('atmr-tablegrid__cell--move');
		});
		for (const [columnKey, state] of Object.entries(highlighted)) {
			if (state !== 'move') continue;
			el.querySelectorAll(`.atmr-tablegrid__cell[data-table-cell-name="${columnKey}"]`).forEach((cell) => {
				if (isOwnTableCell(cell, el)) cell.classList.add('atmr-tablegrid__cell--move');
			});
		}
	});

	// hovered header -> the cells of its column.
	// React attaches these listeners in a passive effect, i.e. AFTER the frame of the commit. When a re-render replaces the element under a
	// stationary pointer (e.g. the sort icon after a click) the browser fires a synthetic `mouseenter` at that frame; React misses it, so the
	// hover highlight of the column is dropped until the pointer moves. Attaching after the next frame reproduces exactly that.
	$effect(() => {
		const el = root;
		void layout.columns;
		if (!el) return;
		const clearColumnHover = () => {
			el.querySelectorAll('.atmr-tablegrid__cell--column-hover').forEach((cell) => {
				if (isOwnTableCell(cell, el)) cell.classList.remove('atmr-tablegrid__cell--column-hover');
			});
		};
		const setColumnHover = (columnName: string, enabled: boolean) => {
			el.querySelectorAll(`.atmr-tablegrid__cell[data-table-cell-name="${columnName}"]:not(.atmr-tablegrid__cell--header)`).forEach((cell) => {
				if (isOwnTableCell(cell, el)) cell.classList.toggle('atmr-tablegrid__cell--column-hover', enabled);
			});
		};
		const handlers = new Map<Element, { enter: () => void; leave: () => void }>();
		const attach = () => {
			const headers = Array.from(el.querySelectorAll('.atmr-tablegrid__cell--header')).filter((header) => isOwnTableCell(header, el));
			headers.forEach((header) => {
				const enter = () => {
					const columnName = header.getAttribute('data-table-cell-name');
					if (columnName) setColumnHover(columnName, true);
				};
				const leave = () => {
					const columnName = header.getAttribute('data-table-cell-name');
					if (columnName) setColumnHover(columnName, false);
				};
				handlers.set(header, { enter, leave });
				header.addEventListener('mouseenter', enter);
				header.addEventListener('mouseleave', leave);
			});
		};
		let timer: ReturnType<typeof setTimeout> | undefined;
		const frame = requestAnimationFrame(() => {
			timer = setTimeout(attach, 0);
		});
		return () => {
			cancelAnimationFrame(frame);
			clearTimeout(timer);
			clearColumnHover();
			handlers.forEach(({ enter, leave }, header) => {
				header.removeEventListener('mouseenter', enter);
				header.removeEventListener('mouseleave', leave);
			});
		};
	});
</script>

<!-- svelte-ignore a11y_no_static_element_interactions, a11y_mouse_events_have_key_events -->
<div bind:this={root} class="atmr-tablegrid__layout" data-table-root="true" {id} style={layoutStyle} onmousemove={onMouseMove} onmouseleave={onMouseLeave} onmouseup={onMouseUp} onmouseover={onCellsMouseOver} ondragover={onCellsDragOver} ondrop={onCellsDrop}>
	{@render children?.()}
</div>
