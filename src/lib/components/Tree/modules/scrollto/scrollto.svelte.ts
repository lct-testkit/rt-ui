// Port of packages/tree/src/components/Tree/modules/scrollto/{ScrollToContext,ScrollToContextProvider}.
//
// SEAM (scroll to a node): `scrollToKey` -> the parent of that node is expanded (only the direct parent, like React) and the row wrapper
// (./_ItemScrollWrapper.svelte) reports its `offsetTop` to `scrollToHandler`, which the list wrapper (./_ListScrollWrapper.svelte) scrolls to.
// React also merged the context of an enclosing Tree (`parentContext`); a Tree renders flat (no nested Trees), so that part is not needed.
import { getContext, setContext, untrack } from 'svelte';
import { useExpand } from '../../../TableGrid/modules/expand/expand.svelte.js';
import { useRows } from '../../../TableGrid/modules/rows/rows.svelte.js';
import type { TreeProps } from '../../types.js';
import { useTreeSelection } from '../selection/selection.svelte.js';

const SCROLL_TO_KEY = Symbol('tree.scrollTo');

export interface TreeScrollToContext {
	readonly scrollToKey: string;
	/** index of the `scrollToKey` row in the flat list (0 when it is not there) */
	readonly scrollToIndex: number;
	readonly scrollToY: number;
	scrollToHandler(y: number): void;
	/** virtual list enabled: no scroll wrappers */
	readonly virtual: boolean;
}

export function createScrollToContext(getProps: () => TreeProps): TreeScrollToContext {
	const selection = useTreeSelection();
	const rows = useRows();
	const expand = useExpand();

	let scrollToY = $state(0);
	const scrollToKey = $derived(getProps().scrollToKey ?? '');
	const virtual = $derived(!!getProps().virtualScroll?.isEnable);
	const scrollToIndex = $derived.by(() => {
		const index = rows.rows.findIndex((row) => row.id === scrollToKey);
		return index >= 0 ? index : 0;
	});

	const scroll = () => {
		if (scrollToKey) {
			const nodes = selection.nodes;
			if (Object.keys(nodes).length > 0) {
				const currentNode = nodes[scrollToKey];
				if (currentNode && currentNode.parent) {
					expand.expandRow(currentNode.parent);
				}
			}
		}
	};

	// useEffect(() => { scroll(); }, [_scrollToKey])
	$effect(() => {
		void scrollToKey;
		untrack(scroll);
	});

	const context: TreeScrollToContext = {
		get scrollToKey() {
			return scrollToKey;
		},
		get scrollToIndex() {
			return scrollToIndex;
		},
		get scrollToY() {
			return scrollToY;
		},
		scrollToHandler(y) {
			scrollToY = y;
		},
		get virtual() {
			return virtual;
		}
	};
	setContext(SCROLL_TO_KEY, context);
	return context;
}

/** React `useContext(ScrollToContext)`. */
export const useTreeScrollTo = (): TreeScrollToContext => getContext<TreeScrollToContext>(SCROLL_TO_KEY);
