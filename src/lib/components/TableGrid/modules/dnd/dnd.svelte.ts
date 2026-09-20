// Port of TableGrid/modules/dnd/{DndContext,DndProviderOld,hooks/useDndController}.
//
// SEAM (column move, `columnConfig.move`): native HTML5 drag and drop of header cells.
//   dragstart on a header cell -> onDragEnter   (remember the dragged column + table id, mark the cell `.dragging`)
//   dragover on any cell       -> onDragMove    (highlight the column under the cursor as `move`)
//   drop on any cell           -> onDragComplete (layout.moveColumn(from, to) when both cells belong to the same table)
// Nested tables share `isMoving` / `currentTableId` with their parent table (a drag never crosses tables).
import { getContext, setContext } from 'svelte';
import { useLayoutActions } from '../layout/layout.svelte.js';

const DND_KEY = Symbol('tablegrid.dnd');

export interface DndContext {
	readonly isMoving: boolean;
	readonly currentTableId: string | null;
	setCurrentTableId(tableId: string | null): void;
	setIsMoving(moving: boolean): void;
	onDragEnter(event: DragEvent): void;
	/** `target`: the cell the event is for (default `event.currentTarget`; the body cells share one delegated listener on the grid root) */
	onDragMove(event: DragEvent, target?: EventTarget | null): void;
	onDragComplete(event: DragEvent, target?: EventTarget | null): void;
}

const cellName = (el: EventTarget | null): string =>
	(el as HTMLElement | null)?.closest('[data-table-cell-name]')?.getAttribute('data-table-cell-name') ?? '';
const tableIdOf = (el: EventTarget | null): string | null =>
	(el as HTMLElement | null)?.closest('[data-columns-table-id]')?.getAttribute('data-columns-table-id') ?? null;

export function createDndContext(): DndContext {
	const parent = getContext<DndContext | undefined>(DND_KEY);
	const { highlitingColumn, moveColumn, resetHighliting } = useLayoutActions();

	let isMoving = $state(false);
	let currentColumn = $state<string | null>(null);
	let tableId = $state<string | null>(null);

	const currentTableId = $derived<string | null>(parent?.currentTableId ? parent.currentTableId : tableId);
	const currentIsMoving = $derived(parent?.isMoving ? parent.isMoving : isMoving);
	const setCurrentTableId = (column: string | null) => (parent?.setCurrentTableId ? parent.setCurrentTableId(column) : (tableId = column));
	const setCurrentIsMoving = (moving: boolean) => (parent?.setIsMoving ? parent.setIsMoving(moving) : (isMoving = moving));

	const context: DndContext = {
		get isMoving() {
			return isMoving;
		},
		get currentTableId() {
			return currentTableId;
		},
		setCurrentTableId(id) {
			tableId = id;
		},
		setIsMoving(moving) {
			isMoving = moving;
		},
		onDragEnter(event) {
			if (currentIsMoving) return;
			setCurrentTableId(tableIdOf(event.currentTarget));
			const column = cellName(event.currentTarget);
			setCurrentIsMoving(true);
			currentColumn = column;
			(event.currentTarget as HTMLElement).classList.add('dragging');
		},
		onDragComplete(event, target = event.currentTarget) {
			event.preventDefault();
			const column = cellName(target);
			const tID = tableIdOf(target);
			if (currentColumn && tID === currentTableId && currentColumn !== column) moveColumn(currentColumn, column);
			const dragged = currentColumn;
			currentColumn = null;
			setCurrentTableId(null);
			resetHighliting();
			setCurrentIsMoving(false);
			document.querySelector(`[data-table-cell-name="${dragged}"]`)?.classList.remove('dragging');
		},
		onDragMove(event, target = event.currentTarget) {
			event.preventDefault();
			if (!currentIsMoving) return;
			if (tableIdOf(target) !== currentTableId) return;
			highlitingColumn(cellName(target), 'move');
		}
	};
	setContext(DND_KEY, context);
	return context;
}

export const useDndController = (): DndContext => getContext<DndContext>(DND_KEY);
