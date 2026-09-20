// Port of shared/modules/layout/{LayoutContext,LayoutProvider,hooks/*}.
//
// SEAM (column layout): owns the "template" columns (the props' columns, re-ordered / re-sized by the user), the CSS grid template
// (`--template-columns`, `--column-<name>`, addon column variables), hover / move highlighting of columns and the column actions
// used by the resize and dnd modules (`resizeColumn`, `stopResizeColumn`, `moveColumn`, `highlitingColumn`, `resetHighliting`).
// The user layout is stored in the shared cache (`table:<id>:columns`) so it survives re-mounts of nested tables.
import { getContext, setContext, untrack, type Snippet } from 'svelte';
import type { TableGridColumn, TableGridRow, TableGridSize } from '../../types.js';
import { generateCellWidth, getColumnCssKey } from '../../utils.js';
import { useConfig } from '../config/config.svelte.js';

const LAYOUT_KEY = Symbol('tablegrid.layout');

export type ColumnHighlight = 'hover' | 'move';

export interface LayoutStyles {
	/** `grid-template-columns` value */
	template: string;
	/** `--column-<name>: <grid line>` custom properties */
	columns: Record<string, number>;
	addonControlSlots: number | undefined;
	addonOffset: string;
}

/**
 * Everything a body cell needs to know about its column, computed ONCE per column (not once per cell): a table of 1000 rows x 8 columns
 * used to evaluate `clsx(...)` / `getColumnCssKey(...)` 8000 times per render. Objects are re-used while the values do not change, so
 * the cells that read them are not invalidated by unrelated column changes (a sort icon, a resize of another column ...).
 */
export interface CellMeta {
	/** row field shown by the cell (`column.key ?? column.name`) */
	key: string;
	/** `column.render` */
	render: Snippet<[TableGridRow]> | undefined;
	/** `class` of the cell up to (and including) `stickyPosition-right`; `warning` / `error` classes follow, then `post` */
	pre: string;
	/** the `align-*` classes (empty or starting with a space) */
	post: string;
	/** `class` of a cell without `warning` / `error` */
	className: string;
	/** `style` attribute of the cell */
	style: string;
}

export interface LayoutContext {
	readonly styles: LayoutStyles;
	readonly columns: TableGridColumn[];
	/** names of `columns` (stable strings: `{#each}` items of a data row do not change when only the column objects are replaced) */
	readonly columnNames: string[];
	/** body cell metadata by column name, see `CellMeta` */
	readonly cellMeta: ReadonlyMap<string, CellMeta>;
	/** `class` of the addon cell (expand button / selection checkbox) of a data row and of the header row */
	readonly addonClass: { readonly row: string; readonly header: string };
	readonly highlitedColumnsByKey: Record<string, ColumnHighlight>;
	readonly nestedOffset: number;
	readonly isShowAddonColumn: boolean;
	readonly tableId: string | undefined;
	readonly updateColumn: { cell: string; width: number } | null;
	readonly size: TableGridSize | undefined;
	moveColumn(fromCell: string, toCell: string): void;
	resizeColumn(cell: string, newWidth: number): void;
	stopResizeColumn(cell: string, width: number): void;
	highlitingColumn(key: string, type?: ColumnHighlight): void;
	resetHighliting(): void;
}

/** React `checkTemplates`: the props columns replace the cached layout only when the number of columns changed. */
const checkTemplates = (cached: TableGridColumn[], columns: TableGridColumn[]): boolean => cached.length !== columns.length;

export function createLayoutContext(): LayoutContext {
	const parent = getContext<LayoutContext | undefined>(LAYOUT_KEY);
	const cfg = useConfig();

	const propColumns = $derived(cfg.config.columns ?? []);
	const nestedOffset = $derived(cfg.config.nestedOffset ?? 0);
	const tableId = $derived(cfg.config.id);
	const cacheColumnKey = $derived(`table:${tableId}:columns`);
	const cachedColumns = $derived(cfg.cache[cacheColumnKey] as TableGridColumn[] | undefined);
	// a nested table inherits the size of the table it is rendered in
	const size = $derived<TableGridSize | undefined>(parent?.size ? parent.size : cfg.config.size);

	const isShowAddonColumn = $derived(cfg.modes.isSelectionModeEnabled || cfg.modes.isExpandableModeEnabled || nestedOffset > 0);

	let templateColumns = $state.raw<TableGridColumn[]>(untrack(() => cachedColumns ?? propColumns.map((column) => ({ ...column }))));
	let updateColumn = $state.raw<{ cell: string; width: number } | null>(null);
	let highlitedColumnsByKey = $state.raw<Record<string, ColumnHighlight>>({});

	// useEffect(..., [columns, cachedColumns]): take the columns from the props unless the user has already re-ordered / re-sized them
	$effect.pre(() => {
		const columns = propColumns;
		const cached = cachedColumns;
		if (!cached || checkTemplates(cached, columns)) {
			templateColumns = columns.map((column) => ({ ...column, key: column.key ?? column.name, name: column.name, size: column.size }));
		}
	});

	const addonControlSlots = $derived.by(() => {
		let controlSlots = 0;
		if (cfg.modes.isSelectionModeEnabled) controlSlots += 1;
		if (cfg.modes.isExpandableModeEnabled) controlSlots += 1;
		if (controlSlots === 0 && nestedOffset > 0) controlSlots = 1;
		return controlSlots;
	});

	const gridTemplateColumns = $derived(
		templateColumns.reduce((acc, column) => {
			if (updateColumn && updateColumn.cell === column.name) return `${acc} ${generateCellWidth({ width: updateColumn.width })}`;
			return `${acc} ${column.size ? generateCellWidth(column.size) : 'auto'}`;
		}, isShowAddonColumn ? 'var(--addon-column-width)' : '')
	);

	const templateColumnsVariables = $derived(
		templateColumns.reduce<Record<string, number>>((acc, column, index) => {
			if (!column) return acc;
			acc[`--column-${getColumnCssKey(column.name)}`] = index + (isShowAddonColumn ? 2 : 1);
			return acc;
		}, {})
	);

	// same array while the names do not change, so the per-row `{#each}` blocks stay untouched when only column properties change
	let previousNames: string[] = [];
	const columnNames = $derived.by<string[]>(() => {
		const names = templateColumns.map((column) => column.name);
		if (names.length === previousNames.length && names.every((name, index) => name === previousNames[index])) return previousNames;
		return (previousNames = names);
	});

	// `clsx('atmr-tablegrid__cell', { draggable, resetPadding, stickyPosition-right, warning, error, align-left, align-right })` per column
	let previousMeta = new Map<string, CellMeta>();
	const cellMeta = $derived.by<Map<string, CellMeta>>(() => {
		const dnd = !!cfg.modes.isDndModeEnabled;
		const alignCells = !!cfg.config.alignCells;
		const next = new Map<string, CellMeta>();
		for (const column of templateColumns) {
			const key = column.key ?? column.name;
			const render = column.render;
			const pre =
				'atmr-tablegrid__cell' +
				(dnd ? ' atmr-tablegrid__cell--draggable' : '') +
				(render ? ' atmr-tablegrid__cell--resetPadding' : '') +
				(column.stickyEnd ? ' atmr-tablegrid__cell--stickyPosition-right' : '');
			const post = alignCells ? ((column.align ?? 'left') === 'left' ? ' atmr-tablegrid__cell--align-left' : column.align === 'right' ? ' atmr-tablegrid__cell--align-right' : '') : '';
			const style = `--column-index: var(--column-${getColumnCssKey(column.name)})`;
			const prev = previousMeta.get(column.name);
			next.set(
				column.name,
				prev && prev.key === key && prev.render === render && prev.pre === pre && prev.post === post && prev.style === style ? prev : { key, render, pre, post, className: pre + post, style }
			);
		}
		previousMeta = next;
		return next;
	});

	// `clsx('atmr-tablegrid__cell', { topleft-cell, header, addon, selection, expand, sticky, stickyPosition-left })` of the addon cell
	const addonClass = $derived.by(() => {
		const common =
			' atmr-tablegrid__cell--addon' +
			(cfg.modes.isSelectionModeEnabled ? ' atmr-tablegrid__cell--selection' : '') +
			(cfg.modes.isExpandableModeEnabled ? ' atmr-tablegrid__cell--expand' : '') +
			(cfg.config.headerSticky ? ' atmr-tablegrid__cell--sticky' : '') +
			(cfg.config.addonSticky ? ' atmr-tablegrid__cell--stickyPosition-left' : '');
		return { row: 'atmr-tablegrid__cell' + common, header: 'atmr-tablegrid__cell atmr-tablegrid__cell--topleft-cell atmr-tablegrid__cell--header' + common };
	});

	const styles = $derived<LayoutStyles>({
		template: gridTemplateColumns,
		columns: templateColumnsVariables,
		addonControlSlots: isShowAddonColumn ? addonControlSlots : undefined,
		addonOffset: nestedOffset > 0 ? `${nestedOffset * 40}px` : '0px'
	});

	const persistColumns = (columns: TableGridColumn[]) => {
		templateColumns = columns;
		cfg.setCache(cacheColumnKey, columns);
	};

	const context: LayoutContext = {
		get styles() {
			return styles;
		},
		get columns() {
			return templateColumns;
		},
		get columnNames() {
			return columnNames;
		},
		get cellMeta() {
			return cellMeta;
		},
		get addonClass() {
			return addonClass;
		},
		get highlitedColumnsByKey() {
			return highlitedColumnsByKey;
		},
		get nestedOffset() {
			return nestedOffset;
		},
		get isShowAddonColumn() {
			return isShowAddonColumn;
		},
		get tableId() {
			return tableId;
		},
		get updateColumn() {
			return updateColumn;
		},
		get size() {
			return size;
		},
		moveColumn(fromCell, toCell) {
			const startIndex = templateColumns.findIndex((cell) => cell.name === fromCell);
			const toIndex = templateColumns.findIndex((cell) => cell.name === toCell);
			const calToIndex = toIndex - (startIndex > toIndex ? 0 : 1);
			if (startIndex === 0 && toIndex === 0) return;
			const currentColumn = templateColumns[startIndex];
			let res = [...templateColumns.slice(0, startIndex), ...templateColumns.slice(startIndex + 1)];
			res = [...res.slice(0, calToIndex), currentColumn, ...res.slice(calToIndex)];
			persistColumns(res);
			if (toIndex - startIndex !== 1) cfg.config.onCollsSwap?.(fromCell, toCell);
		},
		highlitingColumn(key, type) {
			if (updateColumn) return;
			if (!type) {
				highlitedColumnsByKey = {};
				return;
			}
			if (highlitedColumnsByKey[key] && highlitedColumnsByKey[key] === type) return;
			highlitedColumnsByKey = { [key]: type };
		},
		resetHighliting() {
			if (updateColumn) return;
			highlitedColumnsByKey = {};
		},
		resizeColumn(cell, newWidth) {
			updateColumn = { cell, width: newWidth };
		},
		stopResizeColumn(cell, width) {
			cfg.config.onCollsResize?.(cell, width);
			updateColumn = null;
			persistColumns(
				templateColumns.map((column) => (cell === column.name ? { ...column, name: column.name, size: { ...column.size, width } } : column))
			);
		}
	};
	setContext(LAYOUT_KEY, context);
	return context;
}

export const useLayout = (): LayoutContext => getContext<LayoutContext>(LAYOUT_KEY);

/** `useLayoutActions()` of React: the column actions of the table (the methods do not depend on `this`, so they can be destructured). */
export const useLayoutActions = (): Pick<LayoutContext, 'moveColumn' | 'resizeColumn' | 'stopResizeColumn' | 'highlitingColumn' | 'resetHighliting'> => useLayout();
