// Port of TableGrid/modules/filter/{FilterContext,FilterProvider,hooks/useFilterController}.
//
// SEAM (column filters): `column.filter` = { type: 'operators' | 'select', position: 'popover' | 'inline', options, value, onFilter, render }.
// This context only collects the filters by column name and remembers which popover filter is open (one at a time).
// The UI of a filter lives in ./_ColumnFilter.svelte.
import { getContext, setContext } from 'svelte';
import type { TableGridColumnFilter } from '../../types.js';
import { useConfig } from '../config/config.svelte.js';

const FILTER_KEY = Symbol('tablegrid.filter');

export interface FilterContext {
	/** column name -> `column.filter` */
	readonly filters: Record<string, TableGridColumnFilter>;
	/** name of the column whose filter is open (popover position) */
	readonly openFilter: string | null;
	setOpenFilter(colKey: string | null): void;
}

export function createFilterContext(): FilterContext {
	const cfg = useConfig();
	let openFilter = $state<string | null>(null);
	const filters = $derived.by(() => {
		const res: Record<string, TableGridColumnFilter> = {};
		for (const column of cfg.config.columns ?? []) {
			if (column.filter) res[column.name] = column.filter;
		}
		return res;
	});
	const context: FilterContext = {
		get filters() {
			return filters;
		},
		get openFilter() {
			return openFilter;
		},
		setOpenFilter(colKey) {
			openFilter = colKey;
		}
	};
	setContext(FILTER_KEY, context);
	return context;
}

export const useFilterContext = (): FilterContext => getContext<FilterContext>(FILTER_KEY);

/** `useFilterController(colKey)` of React: the `filter` object of a column (or undefined). */
export const useFilterController = (colKey: () => string): { readonly filter: TableGridColumnFilter | undefined } => {
	const context = useFilterContext();
	return {
		get filter() {
			return context.filters[colKey()];
		}
	};
};
