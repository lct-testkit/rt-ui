// Port of packages/tree/src/components/Tree/constants.ts

export const NODE_STATUS = {
	checked: 'checked',
	unchecked: 'unchecked',
	indeterminate: 'indeterminate'
} as const;

export const TREE_SIZES = {
	s: 's',
	m: 'm'
} as const;

export type TreeSize = (typeof TREE_SIZES)[keyof typeof TREE_SIZES];
