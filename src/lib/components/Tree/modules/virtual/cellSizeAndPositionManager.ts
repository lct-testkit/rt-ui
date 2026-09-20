// Port of react-virtualized 9.22.6 `Grid/utils/CellSizeAndPositionManager` and `ScalingCellSizeAndPositionManager` (one axis of a Grid:
// where every row / column starts, how big all of them are together, which ones are visible). The Tree's virtual list is built on a port of
// the react-virtualized List (see ./_VirtualList.svelte) because the reference DOM / positions are those of react-virtualized.

export interface CellSizeAndPosition {
	offset: number;
	size: number;
}

export interface CellSizeGetterParams {
	index: number;
}

export interface ManagerConfig {
	cellCount: number;
	estimatedCellSize: number;
	cellSizeGetter: (params: CellSizeGetterParams) => number | null | undefined;
}

export class CellSizeAndPositionManager {
	private cellSizeAndPositionData: Record<number, CellSizeAndPosition> = {};
	private lastMeasuredIndex = -1;
	private cellCount: number;
	private cellSizeGetter: ManagerConfig['cellSizeGetter'];
	private estimatedCellSize: number;

	constructor({ cellCount, cellSizeGetter, estimatedCellSize }: ManagerConfig) {
		this.cellSizeGetter = cellSizeGetter;
		this.cellCount = cellCount;
		this.estimatedCellSize = estimatedCellSize;
	}

	areOffsetsAdjusted(): boolean {
		return false;
	}

	configure({ cellCount, estimatedCellSize, cellSizeGetter }: ManagerConfig): void {
		this.cellCount = cellCount;
		this.estimatedCellSize = estimatedCellSize;
		this.cellSizeGetter = cellSizeGetter;
	}

	getCellCount(): number {
		return this.cellCount;
	}

	getEstimatedCellSize(): number {
		return this.estimatedCellSize;
	}

	getLastMeasuredIndex(): number {
		return this.lastMeasuredIndex;
	}

	getOffsetAdjustment(): number {
		return 0;
	}

	/** Size and offset of one cell; measures (asks the size getter for) all cells up to `index` that were not measured yet. */
	getSizeAndPositionOfCell(index: number): CellSizeAndPosition {
		if (index < 0 || index >= this.cellCount) {
			throw Error(`Requested index ${index} is outside of range 0..${this.cellCount}`);
		}
		if (index > this.lastMeasuredIndex) {
			const lastMeasuredCellSizeAndPosition = this.getSizeAndPositionOfLastMeasuredCell();
			let offset = lastMeasuredCellSizeAndPosition.offset + lastMeasuredCellSizeAndPosition.size;
			for (let i = this.lastMeasuredIndex + 1; i <= index; i++) {
				const size = this.cellSizeGetter({ index: i });
				if (size === undefined || Number.isNaN(size)) {
					throw Error(`Invalid size returned for cell ${i} of value ${size}`);
				} else if (size === null) {
					this.cellSizeAndPositionData[i] = { offset, size: 0 };
				} else {
					this.cellSizeAndPositionData[i] = { offset, size };
					offset += size;
					this.lastMeasuredIndex = index;
				}
			}
		}
		return this.cellSizeAndPositionData[index];
	}

	getSizeAndPositionOfLastMeasuredCell(): CellSizeAndPosition {
		return this.lastMeasuredIndex >= 0 ? this.cellSizeAndPositionData[this.lastMeasuredIndex] : { offset: 0, size: 0 };
	}

	/** Total size: the measured cells + `estimatedCellSize` for every cell that was not measured yet. */
	getTotalSize(): number {
		const lastMeasuredCellSizeAndPosition = this.getSizeAndPositionOfLastMeasuredCell();
		const totalSizeOfMeasuredCells = lastMeasuredCellSizeAndPosition.offset + lastMeasuredCellSizeAndPosition.size;
		const numUnmeasuredCells = this.cellCount - this.lastMeasuredIndex - 1;
		const totalSizeOfUnmeasuredCells = numUnmeasuredCells * this.estimatedCellSize;
		return totalSizeOfMeasuredCells + totalSizeOfUnmeasuredCells;
	}

	getUpdatedOffsetForIndex({ align = 'auto', containerSize, currentOffset, targetIndex }: { align?: string; containerSize: number; currentOffset: number; targetIndex: number }): number {
		if (containerSize <= 0) {
			return 0;
		}
		const datum = this.getSizeAndPositionOfCell(targetIndex);
		const maxOffset = datum.offset;
		const minOffset = maxOffset - containerSize + datum.size;
		let idealOffset: number;
		switch (align) {
			case 'start':
				idealOffset = maxOffset;
				break;
			case 'end':
				idealOffset = minOffset;
				break;
			case 'center':
				idealOffset = maxOffset - (containerSize - datum.size) / 2;
				break;
			default:
				idealOffset = Math.max(minOffset, Math.min(maxOffset, currentOffset));
				break;
		}
		const totalSize = this.getTotalSize();
		return Math.max(0, Math.min(totalSize - containerSize, idealOffset));
	}

	getVisibleCellRange({ containerSize, offset }: { containerSize: number; offset: number }): { start?: number; stop?: number } {
		const totalSize = this.getTotalSize();
		if (totalSize === 0) {
			return {};
		}
		const maxOffset = offset + containerSize;
		const start = this.findNearestCell(offset);
		const datum = this.getSizeAndPositionOfCell(start);
		offset = datum.offset + datum.size;
		let stop = start;
		while (offset < maxOffset && stop < this.cellCount - 1) {
			stop++;
			offset += this.getSizeAndPositionOfCell(stop).size;
		}
		return { start, stop };
	}

	/** Forgets the measured cells from `index` on (they are measured again the next time they are asked for). */
	resetCell(index: number): void {
		this.lastMeasuredIndex = Math.min(this.lastMeasuredIndex, index - 1);
	}

	private binarySearch(high: number, low: number, offset: number): number {
		while (low <= high) {
			const middle = low + Math.floor((high - low) / 2);
			const currentOffset = this.getSizeAndPositionOfCell(middle).offset;
			if (currentOffset === offset) {
				return middle;
			} else if (currentOffset < offset) {
				low = middle + 1;
			} else if (currentOffset > offset) {
				high = middle - 1;
			}
		}
		if (low > 0) {
			return low - 1;
		}
		return 0;
	}

	private exponentialSearch(index: number, offset: number): number {
		let interval = 1;
		while (index < this.cellCount && this.getSizeAndPositionOfCell(index).offset < offset) {
			index += interval;
			interval *= 2;
		}
		return this.binarySearch(Math.min(index, this.cellCount - 1), Math.floor(index / 2), offset);
	}

	private findNearestCell(offset: number): number {
		if (Number.isNaN(offset)) {
			throw Error(`Invalid offset ${offset} specified`);
		}
		offset = Math.max(0, offset);
		const lastMeasuredCellSizeAndPosition = this.getSizeAndPositionOfLastMeasuredCell();
		const lastMeasuredIndex = Math.max(0, this.lastMeasuredIndex);
		if (lastMeasuredCellSizeAndPosition.offset >= offset) {
			return this.binarySearch(lastMeasuredIndex, 0, offset);
		}
		return this.exponentialSearch(lastMeasuredIndex, offset);
	}
}

/** Chrome's maximum element size (react-virtualized: `getMaxElementSize`); bigger lists are scaled. */
const CHROME_MAX_ELEMENT_SIZE = 1.67771e7;
const DEFAULT_MAX_ELEMENT_SIZE = 1500000;
const getMaxElementSize = (): number => (typeof window !== 'undefined' && !!(window as unknown as { chrome?: unknown }).chrome ? CHROME_MAX_ELEMENT_SIZE : DEFAULT_MAX_ELEMENT_SIZE);

export class ScalingCellSizeAndPositionManager {
	private manager: CellSizeAndPositionManager;
	private maxScrollSize: number;

	constructor(params: ManagerConfig & { maxScrollSize?: number }) {
		const { maxScrollSize = getMaxElementSize(), ...rest } = params;
		this.manager = new CellSizeAndPositionManager(rest);
		this.maxScrollSize = maxScrollSize;
	}

	areOffsetsAdjusted(): boolean {
		return this.manager.getTotalSize() > this.maxScrollSize;
	}

	configure(params: ManagerConfig): void {
		this.manager.configure(params);
	}

	getCellCount(): number {
		return this.manager.getCellCount();
	}

	getEstimatedCellSize(): number {
		return this.manager.getEstimatedCellSize();
	}

	getLastMeasuredIndex(): number {
		return this.manager.getLastMeasuredIndex();
	}

	getOffsetAdjustment({ containerSize, offset }: { containerSize: number; offset: number }): number {
		const totalSize = this.manager.getTotalSize();
		const safeTotalSize = this.getTotalSize();
		const offsetPercentage = this.getOffsetPercentage({ containerSize, offset, totalSize: safeTotalSize });
		return Math.round(offsetPercentage * (safeTotalSize - totalSize));
	}

	getSizeAndPositionOfCell(index: number): CellSizeAndPosition {
		return this.manager.getSizeAndPositionOfCell(index);
	}

	getSizeAndPositionOfLastMeasuredCell(): CellSizeAndPosition {
		return this.manager.getSizeAndPositionOfLastMeasuredCell();
	}

	getTotalSize(): number {
		return Math.min(this.maxScrollSize, this.manager.getTotalSize());
	}

	getUpdatedOffsetForIndex({ align = 'auto', containerSize, currentOffset, targetIndex }: { align?: string; containerSize: number; currentOffset: number; targetIndex: number }): number {
		currentOffset = this.safeOffsetToOffset({ containerSize, offset: currentOffset });
		const offset = this.manager.getUpdatedOffsetForIndex({ align, containerSize, currentOffset, targetIndex });
		return this.offsetToSafeOffset({ containerSize, offset });
	}

	getVisibleCellRange({ containerSize, offset }: { containerSize: number; offset: number }): { start?: number; stop?: number } {
		offset = this.safeOffsetToOffset({ containerSize, offset });
		return this.manager.getVisibleCellRange({ containerSize, offset });
	}

	resetCell(index: number): void {
		this.manager.resetCell(index);
	}

	private getOffsetPercentage({ containerSize, offset, totalSize }: { containerSize: number; offset: number; totalSize: number }): number {
		return totalSize <= containerSize ? 0 : offset / (totalSize - containerSize);
	}

	private offsetToSafeOffset({ containerSize, offset }: { containerSize: number; offset: number }): number {
		const totalSize = this.manager.getTotalSize();
		const safeTotalSize = this.getTotalSize();
		if (totalSize === safeTotalSize) {
			return offset;
		}
		const offsetPercentage = this.getOffsetPercentage({ containerSize, offset, totalSize });
		return Math.round(offsetPercentage * (safeTotalSize - containerSize));
	}

	private safeOffsetToOffset({ containerSize, offset }: { containerSize: number; offset: number }): number {
		const totalSize = this.manager.getTotalSize();
		const safeTotalSize = this.getTotalSize();
		if (totalSize === safeTotalSize) {
			return offset;
		}
		const offsetPercentage = this.getOffsetPercentage({ containerSize, offset, totalSize: safeTotalSize });
		return Math.round(offsetPercentage * (totalSize - containerSize));
	}
}
