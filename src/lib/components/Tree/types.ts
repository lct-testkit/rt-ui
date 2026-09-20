// Public types of the Tree (port of the props of packages/tree/src/components/Tree/Tree.tsx).
//
//   import type { TreeProps, TreeNodeData } from '$lib/components/Tree/types';
//
// React -> Svelte differences: every "node" prop (`ReactNode`: icons, `itemSuffix`, `node.icon`, `node.title`) is `Content`
// (string | number | Snippet); `onClick` is the Tree callback `(key) => void` (not a DOM handler), so it keeps its React name.
import type { Content } from '../../internal/types.js';
import type { TreeSize } from './constants.js';

/** One node of `data`. Every node needs a unique `id` and a `children` array (empty for leaves). */
export interface TreeNodeData {
	id: string;
	key?: string;
	/** Shown when there is no `title` */
	name?: string;
	/** Content of the node (string or snippet), `name` when empty */
	title?: Content;
	/** Own icon of the node (replaces `parent*Icon` / `childIcon`) */
	icon?: Content;
	children: TreeNodeData[];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[field: string]: any;
}

export interface TreeVirtualScroll {
	/** Enables the virtual list (rows outside of the visible area are not rendered); the tree then fills its parent (give it a height) */
	isEnable?: boolean;
	/** `fixed` / `variable` row height (React: only documents it, rows are always measured) */
	listSize?: 'fixed' | 'variable';
	/** Rows rendered outside of the visible area (React: not used by the list, react-virtualized's default of 10 applies) */
	overscanCount?: number;
}

export interface TreeProps {
	/** Tree data: array of nodes with nested `children` */
	data?: TreeNodeData[];
	/** Size of the tree */
	size?: TreeSize;
	/** Shows a checkbox in front of every node */
	checkable?: boolean;
	/** Hides the borders (guide lines) of the tree */
	hideBorders?: boolean;
	/** Background of the selected (clicked) node. Default `var(--atmr-tree-primary-item-color-selected)` */
	activeColor?: string;
	/** Background of the highlighted nodes */
	highlightedColor?: string;
	/** Keys of the expanded nodes (applied when the array content changes) */
	expandedKeys?: string[];
	/** Keys of the checked nodes (initial value, re-applied when the array content changes) */
	checkedKeys?: string[];
	/** Keys of the highlighted nodes */
	highlightedKeys?: string[];
	/** Keys of the disabled nodes */
	disabledKeys?: string[];
	/** Key of the node to scroll to (its parent gets expanded) */
	scrollToKey?: string;
	/** Indent level of the first row (React: recursion counter of nested trees) */
	level?: number;
	/** Virtual list settings */
	virtualScroll?: TreeVirtualScroll;
	/** Content rendered after the title of every node */
	itemSuffix?: Content;
	/** Icon of an expanded node's toggle (React name kept: shown while the node is EXPANDED, default chevron down) */
	collapsedIcon?: Content;
	/** Icon of a collapsed node's toggle (shown while the node is COLLAPSED, default chevron right) */
	expandedIcon?: Content;
	/** Icon of collapsed parent nodes */
	parentCollapsedIcon?: Content;
	/** Icon of expanded parent nodes */
	parentExpandedIcon?: Content;
	/** Icon of leaves */
	childIcon?: Content;
	/** Called with the checked and the indeterminate keys after a checkbox was toggled */
	onCheck?: (checkedKeys: string[], indeterminatedKeys: string[]) => void;
	/** Called with the expanded keys after a node was expanded / collapsed */
	onExpand?: (expandedKeys: string[]) => void;
	/** Called with the key of the clicked node */
	onClick?: (key: string) => void;
}
