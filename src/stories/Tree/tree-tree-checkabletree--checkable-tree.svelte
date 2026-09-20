<script lang="ts">
	// Story: Tree/Tree/CheckableTree (CheckableTree.stories.tsx; story decorator: <div style="align-items: flex-start">)
	import Tree from '$lib/components/Tree/Tree.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import Sp from '../_utils/Sp.svelte';
	import { createRows } from './_utils.js';
</script>

<div style="align-items: flex-start">
	<Typography variant="heading-h2" color="main" style={{ paddingBottom: 'var(--atmr-spacing-3x)' }}>Дерево с чекбоксами</Typography>

	<Tree data={createRows(4)} checkable expandedKeys={['0-0']} />

	<Typography variant="body-m" color="description" style={{ paddingBottom: 'var(--atmr-spacing-3x)', paddingTop: 'var(--atmr-spacing-3x)' }}>
		В параметре<Sp /><Typography as="span" variant="body-m" style={{ color: 'var(--atmr-accent-500)' }}>checkedKeys</Typography><Sp />можно указать по умолчанию выбранные чекбоксы
	</Typography>
	<Tree data={createRows(3)} checkable checkedKeys={['0-0']} expandedKeys={['0-0']} />
</div>
