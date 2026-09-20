// Port of shared/modules/rows/{RowsContext,RowsProvider,hooks/*}.
//
// SEAM (the list of rows): turns `rows` (+ `rowConfig`) into the list of row states that ../body/_TableBody.svelte renders:
// grid position (`--row-index`), expandable flag, colours (`rowConfig.highlightColor / backgroundColor / borderBottom`), the click
// handler (highlight on click, `rowConfig.onClick / onDoubleClick`) and, for the LAST row, the infinite scroll trigger.
// Also owns the highlighted row (shared with nested tables through the config cache) and the `loadMore` gate.
import { START_ROW_POSITION } from '../../constants.js';
import type { TableGridRow, TableGridRowConfig, TableGridRowKey, TableGridVirtual } from '../../types.js';
import { getContext, setContext } from 'svelte';
import { useConfig } from '../config/config.svelte.js';
import { useExpand } from '../expand/expand.svelte.js';
import type { RowState } from '../row/row.svelte.js';

const ROWS_KEY = Symbol('tablegrid.rows');

export interface RowsContext {
	readonly rows: RowState[];
	readonly config: TableGridRowConfig | undefined;
	readonly highlighted: TableGridRowKey | null;
	readonly isHighlightEnabled: boolean;
	readonly virtual: TableGridVirtual | undefined;
	readonly component: 'tree' | undefined;
	/** infinite scroll: calls `infiniteScroll.onLoadMore()` when there is more to load and nothing is loading */
	loadMore(): void;
}

export function createRowsContext(): RowsContext {
	const cfg = useConfig();
	const expand = useExpand();

	const rowConfig = $derived(cfg.config.rowConfig);
	const highlighted = $derived((cfg.cache['highlighted'] as TableGridRowKey | null | undefined) ?? null);
	const setHighlighted = (value: TableGridRowKey | null) => cfg.setCache('highlighted', value);
	const isHighlightEnabled = $derived(!!rowConfig && !!rowConfig.highlightOnClick);

	const loadMore = () => {
		const infiniteScroll = cfg.config.infiniteScroll;
		if (infiniteScroll && infiniteScroll.loadMore && !infiniteScroll.loading && infiniteScroll.onLoadMore) infiniteScroll.onLoadMore();
	};

	const colorOf = (key: 'highlightColor' | 'backgroundColor' | 'borderBottom', rowData: TableGridRow): string | null => {
		const value = rowConfig?.[key];
		if (value && typeof value === 'string') return value;
		if (value && typeof value === 'function') return value(rowData) ?? null;
		return null;
	};

	const onSingleClick = (id: TableGridRowKey) => rowConfig?.onClick?.(id);
	const onDoubleClick = (id: TableGridRowKey) => rowConfig?.onDoubleClick?.(id);

	// React: onClick(id) => (e) => switch (e.detail) { 1: single click + toggle highlight, 2: highlight + double click, default: reset }
	// (the handler reads `highlighted` / `rowConfig` when it runs, so one handler per row id is enough and keeps the row states stable)
	let clickHandlers = new Map<TableGridRowKey, (e: MouseEvent) => void>();
	const rowClickHandler = (id: TableGridRowKey) => {
		let handler = clickHandlers.get(id);
		if (!handler) {
			handler = makeRowClickHandler(id);
			clickHandlers.set(id, handler);
		}
		return handler;
	};
	const makeRowClickHandler = (id: TableGridRowKey) => (e: MouseEvent) => {
		switch (e.detail) {
			case 1:
				onSingleClick(id);
				if (!highlighted || (highlighted && id !== highlighted)) setHighlighted(id);
				else setHighlighted(null);
				break;
			case 2:
				setHighlighted(id);
				onDoubleClick(id);
				break;
			default:
				setHighlighted(null);
				break;
		}
	};

	const isExpandableRow = (data: TableGridRow): boolean => Boolean(cfg.modes.isExpandableModeEnabled && expand.hasExpanded(data));

	// Unique `{#each}` keys: rows with the same id (React: "Encountered two children with the same key" warning, both rows are rendered)
	// get a suffix instead of throwing `each_key_duplicate`. Returns a function that hands out the key of the next row.
	const uniqueKeyMaker = () => {
		const seen = new Map<string, number>();
		return (id: TableGridRowKey): string => {
			const base = String(id);
			const count = seen.get(base) ?? 0;
			seen.set(base, count + 1);
			return count === 0 ? base : `${base}::dup::${count}`;
		};
	};

	// tree mode: a flat list where the children of expanded rows follow their parent
	const getFlatTree = (arr: TableGridRow[], level = 0, makeKey = uniqueKeyMaker()): RowState[] =>
		arr.reduce<RowState[]>((acc, curr, index) => {
			const isExpandable = isExpandableRow(curr);
			acc.push({
				data: curr,
				id: curr.id,
				key: makeKey(curr.id),
				isExpandable,
				level,
				isStart: index === 0,
				isEnd: index + 1 === arr.length,
				highlightColor: colorOf('highlightColor', curr),
				backgroundColor: colorOf('backgroundColor', curr),
				borderBottom: colorOf('borderBottom', curr)
			});
			if (isExpandable && expand.isRowExpanded(String(curr.id))) acc.push(...getFlatTree(curr.children ?? [], level + 1, makeKey));
			return acc;
		}, []);

	// A changed config object (e.g. an inline `rowConfig={{ ... }}` re-created by the parent on every update) rebuilds the states of all
	// rows. States that did not really change are reused, so the rows (and their cells) are not invalidated.
	let previousStates = new Map<string, RowState>();
	const sameInfiniteScroll = (a: RowState['infiniteScroll'], b: RowState['infiniteScroll']) =>
		a === b || (!!a && !!b && a.loadMore === b.loadMore && a.action === b.action && a.isLoadOnAction === b.isLoadOnAction && a.isLoading === b.isLoading && a.loader === b.loader);
	const reuseState = (state: RowState): RowState => {
		const prev = previousStates.get(state.key!);
		if (
			prev &&
			prev.data === state.data &&
			prev.position === state.position &&
			prev.isExpandable === state.isExpandable &&
			prev.onClick === state.onClick &&
			prev.highlightColor === state.highlightColor &&
			prev.backgroundColor === state.backgroundColor &&
			prev.borderBottom === state.borderBottom &&
			prev.isLastElement === state.isLastElement &&
			sameInfiniteScroll(prev.infiniteScroll, state.infiniteScroll)
		) {
			return prev;
		}
		return state;
	};

	const rows = $derived.by<RowState[]>(() => {
		const data = cfg.config.rows ?? [];
		// (the virtual TableGrid uses the same rows as the plain one: `modules/virtual/_VirtualRows.svelte` renders a window of them)
		if (cfg.config.component === 'tree') return getFlatTree(data);

		const idPropsName = rowConfig && rowConfig.key ? rowConfig.key : 'id';
		const infiniteScroll = cfg.config.infiniteScroll;
		// virtual list: only a window of rows is in the DOM and the grid places them itself (no `--row-index`)
		const isVirtual = !!cfg.config.virtual?.isEnable;
		let position = START_ROW_POSITION;
		const makeKey = uniqueKeyMaker();
		const result = data.map((row, index) => {
			const isExpandable = isExpandableRow(row);
			const isLastElement = index + 1 === data.length;
			const id = row[idPropsName];
			const state: RowState = {
				data: row,
				id,
				key: makeKey(id),
				position: isVirtual ? undefined : position,
				triggerPosition: isVirtual && isLastElement ? 'auto' : undefined,
				isExpandable,
				// the last row always carries a (possibly inactive) trigger element, exactly like React
				infiniteScroll: isLastElement
					? {
							loadMore,
							action: infiniteScroll?.action,
							isLoadOnAction: !!infiniteScroll?.action,
							isLoading: infiniteScroll?.loading ?? false,
							loader: infiniteScroll?.loader
						}
					: null,
				onClick: rowClickHandler(id),
				highlightColor: colorOf('highlightColor', row),
				backgroundColor: colorOf('backgroundColor', row),
				borderBottom: colorOf('borderBottom', row),
				isLastElement
			};
			position = isExpandable ? position + 2 : position + 1;
			return reuseState(state);
		});
		previousStates = new Map(result.map((state) => [state.key!, state]));
		clickHandlers = new Map(result.map((state) => [state.id, state.onClick!]));
		return result;
	});

	const context: RowsContext = {
		get rows() {
			return rows;
		},
		get config() {
			return rowConfig;
		},
		get highlighted() {
			return highlighted;
		},
		get isHighlightEnabled() {
			return isHighlightEnabled;
		},
		get virtual() {
			return cfg.config.virtual;
		},
		get component() {
			return cfg.config.component;
		},
		loadMore
	};
	setContext(ROWS_KEY, context);
	return context;
}

export const useRows = (): RowsContext => getContext<RowsContext>(ROWS_KEY);

/** `useIsHighlighted(id)` of React (as a getter, so it can be used inside `$derived`). */
export const useIsHighlighted = (getId: () => TableGridRowKey | undefined): { readonly value: boolean } => {
	const context = useRows();
	return {
		get value() {
			return context.highlighted === getId();
		}
	};
};
