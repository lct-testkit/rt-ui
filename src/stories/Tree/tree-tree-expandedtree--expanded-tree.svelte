<script lang="ts">
	// Story: Tree/Tree/ExpandedTree (ExpandedTree.stories.tsx; story decorator: <div style="align-items: flex-start">)
	import Tree from '$lib/components/Tree/Tree.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import Sp from '../_utils/Sp.svelte';
	import { createRows } from './_utils.js';
</script>

<div style="align-items: flex-start">
	<Typography variant="heading-h2" style={{ paddingBottom: 'var(--atmr-spacing-3x)' }}>Добавление ключей открытых узлов</Typography>
	<Typography variant="body-m" style={{ paddingBottom: 'var(--atmr-spacing-3x)' }}>
		В параметре<Sp /><Typography as="span" variant="body-m" style={{ color: 'var(--atmr-accent-500)' }}>expandedKeys</Typography><Sp />можно указать по умолчанию открытые узлы дерева
	</Typography>
	<Tree data={createRows(10)} checkable expandedKeys={['0-0', '0-0-1', '0-0-0-0']} />
</div>
