<script lang="ts">
	// Story: Tree/Tree -> Tree (Tree.stories.tsx; component decorator: <div style="min-width: 100%; overflow: auto">)
	import Tree from '$lib/components/Tree/Tree.svelte';
	import { createRows } from './_utils.js';

	// `dataLargeNew` of the story file
	const dataLargeNew = createRows(20);

	// initialArgs: meta.args + story.args (the icon controls are empty -> ICONS_TREE[''] = undefined)
	const args = {
		disabledKeys: ['0-2', '0-4-0-1'],
		size: 'm' as const,
		expandedKeys: ['0-4', '0-4-0', '0-4-3'],
		highlightedKeys: ['0-4', '0-1'],
		checkedKeys: ['0-4', '0-1-0-2'],
		virtualScroll: { isEnable: false, listSize: 'fixed' as const, overscanCount: 10 },
		checkable: true
	};
</script>

<div style="min-width: 100%; overflow: auto">
	<Tree {...args} data={dataLargeNew} />
</div>
