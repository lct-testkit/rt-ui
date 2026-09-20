<script lang="ts">
	// Port of packages/tree/src/components/Tree/Tree.tsx (the Rostelecom "Atomaro" tree).
	//
	//   <Tree data={nodes} checkable expandedKeys={['0-0']} checkedKeys={['0-0-1']} disabledKeys={['0-2']} onCheck={(checked, indeterminate) => {}} />
	//
	// Built on the TableGrid package like in React: the Tree creates the TableGrid config / expand / rows contexts (`component: 'tree'`
	// makes the rows context a flat list where the children of expanded nodes follow their parent) and renders its own row (`TreeItem`).
	// The Tree modules (React: providers) are Svelte contexts created here in the React nesting order:
	//
	//   styled      look: size, colours, icons                 chooserow    the clicked ("selected") node, `onClick`
	//   selection   checkboxes (nodes map, checked / indeterminate keys)     [searchgroup: unused in React, not ported]
	//   expand      (TableGrid) expanded keys                  rows         (TableGrid) flat list of the visible nodes
	//   scrollto    `scrollToKey`                              highlight    `highlightedKeys`
	//   disabled    `disabledKeys`                             callbacks    `onCheck`, `onExpand`
	//
	// Props: see ./types.ts (`TreeProps`). React names and defaults are kept; node props (icons, `itemSuffix`, `node.icon`) are `Content`.
	import { createConfigContext } from '../TableGrid/modules/config/config.svelte.js';
	import { createExpandContext } from '../TableGrid/modules/expand/expand.svelte.js';
	import { createRowsContext } from '../TableGrid/modules/rows/rows.svelte.js';
	import type { TableGridProps, TableGridRow } from '../TableGrid/types.js';
	import { TREE_SIZES } from './constants.js';
	import { createCallbacksContext } from './modules/callbacks/callbacks.svelte.js';
	import { createChooseRowContext } from './modules/chooserow/chooserow.svelte.js';
	import { createDisabledContext } from './modules/disabled/disabled.svelte.js';
	import { createHighlightContext } from './modules/highlight/highlight.svelte.js';
	import TreeRows from './modules/rows/_TreeRows.svelte';
	import { createScrollToContext } from './modules/scrollto/scrollto.svelte.js';
	import ListScrollWrapper from './modules/scrollto/_ListScrollWrapper.svelte';
	import { createSelectionContext } from './modules/selection/selection.svelte.js';
	import { createStyledContext } from './modules/styled/styled.svelte.js';
	import TreeItem from './TreeItem/_TreeItem.svelte';
	import type { TreeProps } from './types.js';

	let props: TreeProps = $props();

	const level = $derived(props.level ?? 0);
	const virtualScroll = $derived(props.virtualScroll ?? { isEnable: false, listSize: 'variable', overscanCount: 0 });

	// `currRow` + `config` of Tree.tsx (what the TableGrid modules read through the config context)
	const rowConfig = $derived({
		key: 'id',
		expand: {
			hasExpanded: (expandedData: TableGridRow) => expandedData.children.length > 0,
			// React renders a nested Tree here, but the rows context of a tree is flat (no expand containers), so it is never called
			render: undefined,
			expandedKeys: [...(props.expandedKeys ?? [])]
		},
		selection: { defaultSelected: props.checkedKeys ?? [] }
	});
	const config = {
		get rows() {
			return props.data ?? [];
		},
		get rowConfig() {
			return rowConfig;
		},
		get virtual() {
			return virtualScroll;
		},
		get size() {
			return props.size ?? TREE_SIZES.m;
		},
		offsetEnable: false,
		component: 'tree'
	} as unknown as TableGridProps<TableGridRow>;

	createConfigContext(() => config);
	createStyledContext(() => props);
	createChooseRowContext(() => props);
	const selection = createSelectionContext(() => props);
	createExpandContext();
	createRowsContext();
	createScrollToContext(() => props);
	createHighlightContext(() => props);
	createDisabledContext(() => props);
	createCallbacksContext(() => props);

	// The provider effect of the selection runs after the effects of the modules nested inside it (React: children first)
	$effect(() => {
		selection.sync();
	});

</script>

<ListScrollWrapper isRoot={level === 0}>
	<TreeRows>
		<TreeItem {level} suffix={props.itemSuffix} />
	</TreeRows>
</ListScrollWrapper>
