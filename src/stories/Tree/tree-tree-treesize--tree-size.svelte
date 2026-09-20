<script lang="ts">
	// Story: Tree/Tree/TreeSize (TreeSize.stories.tsx; story decorator: <div style="align-items: flex-start">)
	import Tree from '$lib/components/Tree/Tree.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import Sp from '../_utils/Sp.svelte';
	import { createRows } from './_utils.js';

	const accent = { color: 'var(--atmr-accent-500)' };
</script>

<div style="align-items: flex-start">
	<Typography variant="heading-h2" color="main" style={{ paddingBottom: 'var(--atmr-spacing-3x)' }}>Размер дерева</Typography>

	<Typography variant="body-m" style={{ paddingBottom: 'var(--atmr-spacing-3x)' }}>
		Параметр<Sp /><Typography as="span" variant="body-m" style={accent}>size</Typography><Sp />имеет 2 значения:<Sp /><Typography as="span" variant="body-m" style={accent}>s</Typography><Sp
		/>и<Sp /><Typography as="span" variant="body-m" style={accent}>m</Typography>
	</Typography>

	<Typography variant="heading-h4" color="main" style={{ paddingBottom: 'var(--atmr-spacing-3x)' }}>Маленькое дерево</Typography>

	<Tree data={createRows(3)} size="s" />

	<Typography variant="heading-h4" color="main" style={{ paddingBottom: 'var(--atmr-spacing-3x)', paddingTop: 'var(--atmr-spacing-3x)' }}>Большое дерево</Typography>

	<Tree data={createRows(3)} size="m" />
</div>
