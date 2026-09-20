// Port of TableGrid/modules/resize/{ResizeContext,ResizeProvider,hooks/useResizeController}.
//
// SEAM (column resize, `columnConfig.resize`): every header cell renders a drag handle (./_ResizableBlock.svelte). The flow is
//   mouseenter on a header cell -> onResizePrepare (remember the column + its width)
//   mousedown on the handle     -> onResizeStart   (isResizing = true)
//   mousemove on the table root -> onResizeUpdate  (movementX changes the width; min / max from `column.size` when numeric, else 80..)
//   mouseup / mouseleave        -> onResizeDestroy (commit through the layout module: `stopResizeColumn` -> `onCollsResize`)
// The table-root mouse handlers live in ../layout/_Layout.svelte (`useBindHeaderEvents`).
import { getContext, setContext } from 'svelte';
import { useConfig } from '../config/config.svelte.js';
import { useLayoutActions } from '../layout/layout.svelte.js';

const RESIZE_KEY = Symbol('tablegrid.resize');

/** Minimum column width (px) while resizing, unless `column.size.min` is a number. */
const DEFAULT_MIN_WIDTH = 80;

export interface ResizeContext {
	readonly isResizing: boolean;
	onResizePrepare(event: MouseEvent): void;
	onResizeStart(event: MouseEvent): void;
	onResizeUpdate(event: MouseEvent): void;
	onResizeDestroy(event: MouseEvent): void;
}

export function createResizeContext(): ResizeContext {
	const cfg = useConfig();
	const { resizeColumn, highlitingColumn, stopResizeColumn } = useLayoutActions();
	let isResizing = $state(false);
	let cell = '';
	let width = 0;

	const context: ResizeContext = {
		get isResizing() {
			return isResizing;
		},
		onResizePrepare(event) {
			if (isResizing) return;
			const root = (event.currentTarget as HTMLElement | null)?.closest<HTMLElement>('[data-header-cell-name]');
			if (!root) return;
			const columnName = root.getAttribute('data-header-cell-name');
			if (!columnName) return;
			cell = columnName;
			width = root.offsetWidth;
			highlitingColumn(cell, 'hover');
		},
		onResizeUpdate(event) {
			if (!isResizing) return;
			if (event.movementX === 0) return;
			const currentColumn = cfg.config.columns?.find((c) => c.name === cell);
			let newWidth = width + event.movementX;
			let minWidth = DEFAULT_MIN_WIDTH;
			let maxWidth: number | undefined;
			if (currentColumn && currentColumn.size) {
				if (typeof currentColumn.size.min === 'number') minWidth = currentColumn.size.min;
				if (typeof currentColumn.size.max === 'number') maxWidth = currentColumn.size.max;
			}
			if (newWidth < minWidth) newWidth = minWidth;
			else if (maxWidth !== undefined && newWidth > maxWidth) newWidth = maxWidth;
			resizeColumn(cell, newWidth);
			highlitingColumn(cell, 'hover');
			width = newWidth;
		},
		onResizeDestroy(event) {
			event.stopPropagation();
			event.preventDefault();
			stopResizeColumn(cell, width);
			isResizing = false;
		},
		onResizeStart(event) {
			event.stopPropagation();
			event.preventDefault();
			isResizing = true;
		}
	};
	setContext(RESIZE_KEY, context);
	return context;
}

export const useResizeController = (): ResizeContext => getContext<ResizeContext>(RESIZE_KEY);
