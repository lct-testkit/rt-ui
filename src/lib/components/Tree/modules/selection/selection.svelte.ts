// Port of packages/tree/src/components/Tree/modules/selection/{SelectionContext,SelectionProvider,hooks/useSelectionController}.
//
// SEAM (checkboxes): the `nodes` map (key -> node with its children / parent), the checked and the indeterminate keys.
//   * `nodes` is (re)built from `checkedKeys` when `data`, the content of `checkedKeys` or the content of `disabledKeys` change
//     (React: `useEffect` with those dependencies -> `sync()`, called from an `$effect` of the Tree);
//   * a click on a checkbox calls `toggleSelectGroupRow(key)` (mutates the node objects, publishes a new map) and then `getSelectedRows(key)`
//     (the keys to report to `onCheck`).
// The nodes are MUTATED in place (like in React), so the state is `$state.raw` (no deep proxy) and only its identity is observed.
import { getContext, setContext, untrack } from 'svelte';
import type { TreeProps } from '../../types.js';
import { getNodes, getSelectedNodes, selectHandle, type SelectionNodes } from './utils.js';

const SELECTION_KEY = Symbol('tree.selection');

export interface TreeSelectionContext {
	readonly selectedRows: string[];
	readonly indeterminatedRows: string[];
	readonly checkable: boolean | undefined;
	readonly nodes: SelectionNodes;
	setNodes(nodes: SelectionNodes): void;
	toggleSelectGroupRow(key: string): void;
	/** Checked and indeterminate keys after `key` changed; also stores them (React `setSelectedRows` / `setIndeterminatedRows`). */
	getSelectedRows(key: string): [string[], string[]];
	/**
	 * The body of the provider's `useEffect`. Call it inside an `$effect` of the owner AFTER the effects of the modules that are nested
	 * deeper in React (scroll-to ...) were registered: React runs the effects of the inner providers first.
	 */
	sync(): void;
}

export function createSelectionContext(getProps: () => TreeProps): TreeSelectionContext {
	let selectedRows = $state.raw<string[]>([]);
	let indeterminatedRows = $state.raw<string[]>([]);
	let nodes = $state.raw<SelectionNodes>({});

	const disabledKeys = () => getProps().disabledKeys ?? [];

	const context: TreeSelectionContext = {
		get selectedRows() {
			return selectedRows;
		},
		get indeterminatedRows() {
			return indeterminatedRows;
		},
		get checkable() {
			return getProps().checkable;
		},
		get nodes() {
			return nodes;
		},
		setNodes(next) {
			nodes = next;
		},
		toggleSelectGroupRow(key) {
			selectHandle(nodes, key, (next) => (nodes = next), disabledKeys());
		},
		getSelectedRows(key) {
			const [selected, indeterminated] = getSelectedNodes(nodes, key, [...selectedRows], [...indeterminatedRows]);
			selectedRows = [...selected];
			indeterminatedRows = [...indeterminated];
			return [selected, indeterminated];
		},
		sync() {
			const props = getProps();
			// dependencies of the React effect: [defaultSelectedSignature, rows, disabledKeysSignature]
			const rows = props.data ?? [];
			const defaultSelectedKeys = props.checkedKeys ?? [];
			void defaultSelectedKeys.map(String).join('\0');
			void disabledKeys().map(String).join('\0');
			untrack(() => {
				if (defaultSelectedKeys && rows.length) {
					const defaultSelected = [...defaultSelectedKeys];
					const tmpNodes = getNodes(rows, defaultSelected, '', disabledKeys());
					nodes = tmpNodes;
					let tmpSelectedRows: [string[], string[]] = [[], []];
					defaultSelected.forEach((key) => {
						tmpSelectedRows = getSelectedNodes(tmpNodes, key, [...tmpSelectedRows[0]], [...tmpSelectedRows[1]]);
					});
					selectedRows = [...tmpSelectedRows[0]];
					indeterminatedRows = [...tmpSelectedRows[1]];
				}
			});
		}
	};
	setContext(SELECTION_KEY, context);
	return context;
}

/** React `useContext(SelectionContext)`. */
export const useTreeSelection = (): TreeSelectionContext => getContext<TreeSelectionContext>(SELECTION_KEY);

/** React `useSelectionController(rowKey)`: the checkbox state of one node (getters, so it can be used inside `$derived`). */
export function useSelectionController(getRowKey: () => string) {
	const selection = useTreeSelection();
	return {
		get isSelected(): boolean {
			const node = selection.nodes[getRowKey()];
			return node ? node.checked : false;
		},
		get isIndeterminated(): boolean {
			const node = selection.nodes[getRowKey()];
			return node ? !!node.indeterminated : false;
		},
		toggleSelectGroup: () => selection.toggleSelectGroupRow(getRowKey()),
		getSelected: () => selection.getSelectedRows(getRowKey())
	};
}
