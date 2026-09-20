// Port of TableGrid/modules/sorting/{SortingContext,SortingProvider,hooks/useSortingController}.
//
// SEAM (sorting): the table does not sort anything. Every column with `sorting: { sort, onSort }` gets a sort button in its header
// (when `columnConfig.sorting` is on); the button shows the current `sort` ('asc' | 'desc' | 'default') and calls `onSort()`.
// The consumer sorts its data and passes the new `sort` back through `columns`.
import { getContext, setContext } from 'svelte';
import type { TableGridColumnSorting } from '../../types.js';
import { useConfig } from '../config/config.svelte.js';

const SORTING_KEY = Symbol('tablegrid.sorting');

export interface SortingContext {
	/** column name -> `column.sorting` */
	readonly sortings: Record<string, TableGridColumnSorting>;
}

export function createSortingContext(): SortingContext {
	const cfg = useConfig();
	const sortings = $derived.by(() => {
		const res: Record<string, TableGridColumnSorting> = {};
		for (const column of cfg.config.columns ?? []) {
			if (column.sorting) res[column.name] = column.sorting;
		}
		return res;
	});
	const context: SortingContext = {
		get sortings() {
			return sortings;
		}
	};
	setContext(SORTING_KEY, context);
	return context;
}

export const useSorting = (): SortingContext => getContext<SortingContext>(SORTING_KEY);

/** `useSortingController(colKey)` of React: the `sorting` object of a column (or undefined). */
export const useSortingController = (colKey: () => string): { readonly sorting: TableGridColumnSorting | undefined } => {
	const context = useSorting();
	return {
		get sorting() {
			return context.sortings[colKey()];
		}
	};
};
