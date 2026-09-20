// Port of TableGrid/modules/selection/{SelectionContext,SelectionProvider,hooks/useSelection,hooks/useSelectionController}.
//
// SEAM (row selection): `rowConfig.selection` = { defaultSelected, onSelect, onSelectionChange, renderFirstColumnHeader, getRowCheckboxState }.
//   * uncontrolled (no `onSelectionChange`): the table keeps the selection itself, `defaultSelected` is the initial value AND is
//     re-applied whenever it changes (stories keep it in sync with their own state through `onSelect`);
//   * controlled (`defaultSelected` + `onSelectionChange`): the selection is exactly `defaultSelected`, changes are reported only.
// Keys are strings (`String(row.id)`); `onSelect(key)` receives the key of the toggled row, `onSelectionChange(keys)` the new selection.
import { getContext, setContext, untrack } from 'svelte';
import type { TableGridRowKey } from '../../types.js';
import { normalizeRowKey } from '../../utils.js';
import { useConfig } from '../config/config.svelte.js';

const SELECTION_KEY = Symbol('tablegrid.selection');

export interface SelectionContext {
	readonly selectedRows: string[];
	/** O(1) `selectedRows.includes(key)` (every row checkbox asks; `includes` made "select all" quadratic) */
	isRowSelected(rowKey: string): boolean;
	toggleSelectRow(targetRow: TableGridRowKey): void;
	setRowSelected(targetRow: TableGridRowKey, selected: boolean): void;
	clearSelection(): void;
	selectAll(rowKeys: TableGridRowKey[]): void;
}

const sameKeys = (a: string[], b: string[]): boolean => a.length === b.length && a.every((key, index) => key === b[index]);

export function createSelectionContext(): SelectionContext {
	const cfg = useConfig();
	const selection = $derived(cfg.config.rowConfig?.selection);
	const defaultSelected = $derived(selection?.defaultSelected);
	const isControlled = $derived(defaultSelected !== undefined && typeof selection?.onSelectionChange === 'function');

	// React memoises the normalised array by the joined signature, so equal arrays keep the same identity
	const defaultSelectedSignature = $derived(defaultSelected?.join('\0') ?? '');
	const normalizedDefaultSelected = $derived.by<string[]>(() => {
		void defaultSelectedSignature;
		return untrack(() => (defaultSelected !== undefined ? defaultSelected.map(normalizeRowKey) : []));
	});

	let uncontrolledSelected = $state.raw<string[]>(untrack(() => normalizedDefaultSelected));

	// useLayoutEffect: an uncontrolled table follows a changed `defaultSelected`
	$effect.pre(() => {
		const next = normalizedDefaultSelected;
		if (!isControlled && defaultSelected !== undefined && !sameKeys(untrack(() => uncontrolledSelected), next)) {
			uncontrolledSelected = next;
		}
	});

	const selectedRows = $derived(isControlled ? normalizedDefaultSelected : uncontrolledSelected);
	const selectedSet = $derived(new Set(selectedRows));

	const commitSelection = (nextSelected: string[], rowKey?: string) => {
		if (!isControlled) {
			uncontrolledSelected = sameKeys(uncontrolledSelected, nextSelected) ? uncontrolledSelected : nextSelected;
		}
		if (rowKey !== undefined) selection?.onSelect?.(rowKey);
		selection?.onSelectionChange?.(nextSelected);
	};

	const context: SelectionContext = {
		get selectedRows() {
			return selectedRows;
		},
		isRowSelected(rowKey) {
			return selectedSet.has(rowKey);
		},
		toggleSelectRow(targetRow) {
			const rowKey = normalizeRowKey(targetRow);
			const current = selectedRows;
			commitSelection(current.includes(rowKey) ? current.filter((r) => r !== rowKey) : [...current, rowKey], rowKey);
		},
		setRowSelected(targetRow, selected) {
			const rowKey = normalizeRowKey(targetRow);
			const current = selectedRows;
			if (selected === current.includes(rowKey)) return;
			commitSelection(selected ? [...current, rowKey] : current.filter((r) => r !== rowKey), rowKey);
		},
		clearSelection() {
			commitSelection([]);
		},
		selectAll(rowKeys) {
			commitSelection([...new Set([...selectedRows, ...rowKeys.map(normalizeRowKey)])]);
		}
	};
	setContext(SELECTION_KEY, context);
	return context;
}

/**
 * `useSelection()` of React: `{ selectedRows, toggleSelectRow, setRowSelected, clearSelection, selectAll }`.
 * Works only inside a TableGrid (e.g. in the `renders.actionBar` / `renderFirstColumnHeader` / cell snippets).
 */
export const useSelection = (): SelectionContext => getContext<SelectionContext>(SELECTION_KEY);
