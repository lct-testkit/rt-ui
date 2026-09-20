// Port of shared/modules/expand/{ExpandContext,ExpandProvider,hooks/useExpandController,hooks/useExpandFunctions}.
//
// SEAM (expandable rows): which rows are expanded + how to render the expanded content. `rowConfig.expand` = { hasExpanded, render,
// expandedKeys }. The expanded state of ALL nested tables lives in the outermost table (a nested table's provider delegates to its
// parent), so rows stay expanded when a nested table is re-mounted. Keys are compared as strings (numeric ids work too).
import { getContext, setContext, untrack, type Snippet } from 'svelte';
import type { TableGridRow, TableGridRowKey } from '../../types.js';
import { normalizeRowKey } from '../../utils.js';
import { useConfig } from '../config/config.svelte.js';

const EXPAND_KEY = Symbol('tablegrid.expand');

export interface ExpandContext {
	readonly expandedRows: string[];
	/** O(1) `expandedRows.includes(key)` */
	isRowExpanded(rowKey: string): boolean;
	/** `rowConfig.expand.render` (a snippet that receives the row), undefined when the table has no expandable rows */
	readonly expandRender: Snippet<[TableGridRow]> | undefined;
	/** addon column width is used as the left offset of the expanded content */
	readonly offsetEnable: boolean;
	toggleExpandRow(targetRow: TableGridRowKey): string[];
	expandRow(targetRow: TableGridRowKey): void;
	collapsRow(targetRow: TableGridRowKey): void;
	setExpandedRows(rows: TableGridRowKey[]): void;
	hasExpanded(rowData: TableGridRow): boolean;
}

export function createExpandContext(): ExpandContext {
	const parent = getContext<ExpandContext | undefined>(EXPAND_KEY);
	const cfg = useConfig();

	const expand = $derived(cfg.config.rowConfig?.expand);
	const offsetEnable = $derived(cfg.config.offsetEnable ?? true);
	const cachedValue = $derived(cfg.cache['expand'] as string[] | undefined);

	let ownRows = $state.raw<string[]>(untrack(() => (cachedValue ?? expand?.expandedKeys ?? []).map(normalizeRowKey)));
	const expandedRows = $derived<string[]>(parent ? parent.expandedRows : (cachedValue ?? ownRows));
	const expandedSet = $derived(new Set(expandedRows));

	const setExpandedRows = (rows: TableGridRowKey[]) => {
		const next = rows.map(normalizeRowKey);
		if (parent) {
			parent.setExpandedRows(next);
			return;
		}
		cfg.setCache('expand', next);
		ownRows = next;
	};

	// useEffect(..., [expandedKeysSignature]): a changed `expandedKeys` prop replaces the expanded rows
	const expandedKeysSignature = $derived(expand?.expandedKeys?.map(String).join('\0') ?? '');
	$effect.pre(() => {
		void expandedKeysSignature;
		untrack(() => {
			const keys = expand?.expandedKeys;
			if (keys === undefined) return;
			const next = keys.map(String);
			if (expandedRows.length === next.length && expandedRows.every((key, index) => key === next[index])) return;
			setExpandedRows(next);
		});
	});

	const context: ExpandContext = {
		get expandedRows() {
			return expandedRows;
		},
		isRowExpanded(rowKey) {
			return expandedSet.has(rowKey);
		},
		get expandRender() {
			return expand?.render;
		},
		get offsetEnable() {
			return offsetEnable;
		},
		toggleExpandRow(targetRow) {
			const key = normalizeRowKey(targetRow);
			const res = expandedRows.includes(key) ? expandedRows.filter((r) => r !== key) : [...expandedRows, key];
			setExpandedRows(res);
			return res;
		},
		expandRow(targetRow) {
			setExpandedRows([...expandedRows, normalizeRowKey(targetRow)]);
		},
		collapsRow(targetRow) {
			const key = normalizeRowKey(targetRow);
			setExpandedRows(expandedRows.filter((r) => r !== key));
		},
		setExpandedRows,
		hasExpanded(rowData) {
			return expand?.hasExpanded ? expand.hasExpanded(rowData) : false;
		}
	};
	setContext(EXPAND_KEY, context);
	return context;
}

/** Context of the surrounding table; `undefined` outside of a TableGrid. */
export const useExpand = (): ExpandContext => getContext<ExpandContext>(EXPAND_KEY);
