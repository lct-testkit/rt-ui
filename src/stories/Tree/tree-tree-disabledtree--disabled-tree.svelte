<script lang="ts">
	// Story: Tree/Tree/DisabledTree (DisabledTree.stories.tsx; story decorator: <div style="align-items: flex-start">)
	import Tree from '$lib/components/Tree/Tree.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import Sp from '../_utils/Sp.svelte';
	import { createRows } from './_utils.js';
</script>

<div style="align-items: flex-start">
	<Typography variant="heading-h2" style={{ paddingBottom: 'var(--atmr-spacing-3x)' }}>Дерево с отключенными элементами</Typography>
	<Typography variant="body-m" style={{ paddingBottom: 'var(--atmr-spacing-3x)' }}>
		В параметре<Sp /><Typography as="span" variant="body-m" style={{ color: 'var(--atmr-accent-500)' }}>disabledKeys</Typography><Sp />можно указать массив ключей элементов, которые должны быть отключены
	</Typography>
	<Tree data={createRows(5)} checkable expandedKeys={['0-0']} disabledKeys={['0-0-2', '0-2']} />
</div>
