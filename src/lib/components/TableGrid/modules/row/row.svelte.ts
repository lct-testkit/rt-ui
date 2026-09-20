// Port of shared/modules/row/{RowCotext,RowProvider,hooks/useRow}.
//
// SEAM (one row): `<RowProvider {row}>` (./_RowProvider.svelte) puts the state of the row that is being rendered into a context;
// row-level parts (cells, expand / selection buttons, expand container) read it with `useRow()`. Outside of a row (the header row)
// `useRow()` returns an empty object, like the default value of the React context.
import { getContext, setContext, type Snippet } from 'svelte';
import type { Content } from '../../../../internal/types.js';
import type { TableGridRow, TableGridRowKey } from '../../types.js';

const ROW_KEY = Symbol('tablegrid.row');

export interface RowInfiniteScroll {
	/** `infiniteScroll.action` is set: render it (a "load more" button) instead of observing the row */
	isLoadOnAction: boolean;
	isLoading: boolean;
	/** `infiniteScroll.loadMore` gate (`loadMore && !loading && onLoadMore`) + `onLoadMore()` */
	loadMore: () => void;
	/** `infiniteScroll.action(loadMore)` */
	action?: Snippet<[() => void]>;
	/** `infiniteScroll.loader` */
	loader?: Content;
}

/** State of one rendered row (`rowProps` of React's RowProvider). */
export interface RowState {
	data: TableGridRow;
	id: TableGridRowKey;
	/**
	 * Unique key of the row in the list (the `{#each}` key of `_TableBody`). Equals `String(id)`; the 2nd, 3rd .. row that has the same id
	 * (React only warns about duplicate keys and renders every such row) get a suffix, so duplicate ids do not throw `each_key_duplicate`.
	 */
	key?: string;
	/** CSS grid row (`--row-index`); not set in the virtual list, where the rows of the window are placed by the grid itself */
	position?: number;
	/** CSS grid row of the infinite scroll trigger of the last row (default `+id + 100`, the value of the React component; `'auto'` in the virtual list) */
	triggerPosition?: number | 'auto';
	isExpandable: boolean;
	infiniteScroll?: RowInfiniteScroll | null;
	onClick?: (event: MouseEvent) => void;
	onDoubleClick?: (event: MouseEvent) => void;
	highlightColor?: string | null;
	backgroundColor?: string | null;
	borderBottom?: string | null;
	isLastElement?: boolean;
	isStart?: boolean;
	isEnd?: boolean;
	level?: number;
}

export type RowContext = Partial<RowState>;

/** Called by `<RowProvider>`: `getRow` is read lazily, so the context follows changes of the row. */
export const setRowContext = (getRow: () => RowState): void => {
	setContext(ROW_KEY, getRow);
};

/**
 * `useRow()` of React. Returns a getter of the current row (`{}` outside of a row): `const row = useRow(); const data = $derived(row().data);`
 */
export const useRow = (): (() => RowContext) => getContext<(() => RowState) | undefined>(ROW_KEY) ?? (() => ({}));
