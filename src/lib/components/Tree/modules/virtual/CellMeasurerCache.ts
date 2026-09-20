// Port of react-virtualized 9.22.6 `CellMeasurer/CellMeasurerCache`: remembers the measured size of the cells (rows / columns) of a Grid.
// The Tree creates it as `new CellMeasurerCache({ minHeight: 40, fixedWidth: true })`: rows that were not measured yet are 40px high,
// measured rows are at least 40px, the width is never measured.

export interface CellMeasurerCacheParams {
	defaultHeight?: number;
	defaultWidth?: number;
	fixedHeight?: boolean;
	fixedWidth?: boolean;
	minHeight?: number;
	minWidth?: number;
}

const DEFAULT_HEIGHT = 30;
const DEFAULT_WIDTH = 100;

const defaultKeyMapper = (rowIndex: number, columnIndex: number): string => `${rowIndex}-${columnIndex}`;

export class CellMeasurerCache {
	private cellHeightCache: Record<string, number> = {};
	private cellWidthCache: Record<string, number> = {};
	private columnWidthCache: Record<string, number> = {};
	private rowHeightCache: Record<string, number> = {};
	private readonly defaultHeightValue: number;
	private readonly defaultWidthValue: number;
	private readonly minHeight: number;
	private readonly minWidth: number;
	private readonly hasFixedHeightValue: boolean;
	private readonly hasFixedWidthValue: boolean;
	private columnCount = 0;
	private rowCount = 0;

	constructor(params: CellMeasurerCacheParams = {}) {
		const { defaultHeight, defaultWidth, fixedHeight, fixedWidth, minHeight, minWidth } = params;
		this.hasFixedHeightValue = fixedHeight === true;
		this.hasFixedWidthValue = fixedWidth === true;
		this.minHeight = minHeight || 0;
		this.minWidth = minWidth || 0;
		this.defaultHeightValue = Math.max(this.minHeight, typeof defaultHeight === 'number' ? defaultHeight : DEFAULT_HEIGHT);
		this.defaultWidthValue = Math.max(this.minWidth, typeof defaultWidth === 'number' ? defaultWidth : DEFAULT_WIDTH);
	}

	/** `columnWidth` of a Grid */
	columnWidth = ({ index }: { index: number }): number => {
		const key = defaultKeyMapper(0, index);
		return this.columnWidthCache[key] !== undefined ? this.columnWidthCache[key] : this.defaultWidthValue;
	};

	/** `rowHeight` of a Grid / List (the measured height of the row, else the default) */
	rowHeight = ({ index }: { index: number }): number => {
		const key = defaultKeyMapper(index, 0);
		return this.rowHeightCache[key] !== undefined ? this.rowHeightCache[key] : this.defaultHeightValue;
	};

	clear(rowIndex: number, columnIndex = 0): void {
		const key = defaultKeyMapper(rowIndex, columnIndex);
		delete this.cellHeightCache[key];
		delete this.cellWidthCache[key];
		this.updateCachedColumnAndRowSizes(rowIndex, columnIndex);
	}

	clearAll(): void {
		this.cellHeightCache = {};
		this.cellWidthCache = {};
		this.columnWidthCache = {};
		this.rowHeightCache = {};
		this.rowCount = 0;
		this.columnCount = 0;
	}

	get defaultHeight(): number {
		return this.defaultHeightValue;
	}

	get defaultWidth(): number {
		return this.defaultWidthValue;
	}

	hasFixedHeight(): boolean {
		return this.hasFixedHeightValue;
	}

	hasFixedWidth(): boolean {
		return this.hasFixedWidthValue;
	}

	getHeight(rowIndex: number, columnIndex = 0): number {
		if (this.hasFixedHeightValue) {
			return this.defaultHeightValue;
		}
		const key = defaultKeyMapper(rowIndex, columnIndex);
		return this.cellHeightCache[key] !== undefined ? Math.max(this.minHeight, this.cellHeightCache[key]) : this.defaultHeightValue;
	}

	getWidth(rowIndex: number, columnIndex = 0): number {
		if (this.hasFixedWidthValue) {
			return this.defaultWidthValue;
		}
		const key = defaultKeyMapper(rowIndex, columnIndex);
		return this.cellWidthCache[key] !== undefined ? Math.max(this.minWidth, this.cellWidthCache[key]) : this.defaultWidthValue;
	}

	/** Was this cell measured? */
	has(rowIndex: number, columnIndex = 0): boolean {
		const key = defaultKeyMapper(rowIndex, columnIndex);
		return this.cellHeightCache[key] !== undefined;
	}

	set(rowIndex: number, columnIndex: number, width: number, height: number): void {
		const key = defaultKeyMapper(rowIndex, columnIndex);
		if (columnIndex >= this.columnCount) {
			this.columnCount = columnIndex + 1;
		}
		if (rowIndex >= this.rowCount) {
			this.rowCount = rowIndex + 1;
		}
		this.cellHeightCache[key] = height;
		this.cellWidthCache[key] = width;
		this.updateCachedColumnAndRowSizes(rowIndex, columnIndex);
	}

	private updateCachedColumnAndRowSizes(rowIndex: number, columnIndex: number): void {
		if (!this.hasFixedWidthValue) {
			let columnWidth = 0;
			for (let i = 0; i < this.rowCount; i++) {
				columnWidth = Math.max(columnWidth, this.getWidth(i, columnIndex));
			}
			const columnKey = defaultKeyMapper(0, columnIndex);
			this.columnWidthCache[columnKey] = columnWidth;
		}
		if (!this.hasFixedHeightValue) {
			let rowHeight = 0;
			for (let i = 0; i < this.columnCount; i++) {
				rowHeight = Math.max(rowHeight, this.getHeight(rowIndex, i));
			}
			const rowKey = defaultKeyMapper(rowIndex, 0);
			this.rowHeightCache[rowKey] = rowHeight;
		}
	}
}
