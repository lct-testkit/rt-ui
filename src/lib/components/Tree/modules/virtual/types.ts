// Types shared by the files of the react-virtualized port (see _VirtualList.svelte).

/** What a row cell (MeasuredCell) needs from the list: to be told that its size was measured (React: `parent.invalidateCellSizeAfterRender`). */
export interface VirtualListApi {
	invalidateCellSizeAfterRender(params: { columnIndex: number; rowIndex: number }): void;
}

/** One rendered row of the list. */
export interface VirtualListCell {
	/** row index (the React key of the cell is `<rowIndex>-0`) */
	index: number;
	/** inline style of the row `<div>` (absolute position inside the scroll container) */
	style: string;
}
