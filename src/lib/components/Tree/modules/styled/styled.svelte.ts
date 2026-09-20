// Port of packages/tree/src/components/Tree/modules/styled/{StyledContext,StyledProvider}.
//
// SEAM (look of the tree): size, borders, colours and the icons of the nodes. Like React the icons are `undefined` unless set;
// the default toggle chevrons (24px for size `m`, 16px otherwise) are rendered by ../../TreeItem/_ExpandButton.svelte.
import { getContext, setContext } from 'svelte';
import type { Content } from '../../../../internal/types.js';
import { TREE_SIZES, type TreeSize } from '../../constants.js';
import type { TreeProps } from '../../types.js';

const STYLED_KEY = Symbol('tree.styled');

export interface TreeStyledContext {
	/** icon of an EXPANDED node's toggle (`collapsedIcon` prop) or undefined (default chevron down) */
	readonly collapsedIcon: Content;
	/** icon of a COLLAPSED node's toggle (`expandedIcon` prop) or undefined (default chevron right) */
	readonly expandedIcon: Content;
	readonly childIcon: Content;
	readonly parentCollapsedIcon: Content;
	readonly parentExpandedIcon: Content;
	readonly highlightedColor: string | undefined;
	readonly activeColor: string | undefined;
	readonly size: TreeSize;
	readonly hideBorders: boolean | undefined;
}

export function createStyledContext(getProps: () => TreeProps): TreeStyledContext {
	const context: TreeStyledContext = {
		get collapsedIcon() {
			return getProps().collapsedIcon || undefined;
		},
		get expandedIcon() {
			return getProps().expandedIcon || undefined;
		},
		get childIcon() {
			return getProps().childIcon || undefined;
		},
		get parentCollapsedIcon() {
			return getProps().parentCollapsedIcon || undefined;
		},
		get parentExpandedIcon() {
			return getProps().parentExpandedIcon || undefined;
		},
		get highlightedColor() {
			return getProps().highlightedColor;
		},
		get activeColor() {
			return getProps().activeColor;
		},
		get size() {
			return getProps().size ?? TREE_SIZES.m;
		},
		get hideBorders() {
			return getProps().hideBorders;
		}
	};
	setContext(STYLED_KEY, context);
	return context;
}

/** React `useContext(StyledContext)`. */
export const useTreeStyled = (): TreeStyledContext => getContext<TreeStyledContext>(STYLED_KEY);
