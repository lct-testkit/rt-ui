<script lang="ts">
	// Story: Tree/Tree/ActiveColor (ActiveColor.stories.tsx; story decorator: <div style="align-items: flex-start">)
	import Tree from '$lib/components/Tree/Tree.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import Sp from '../_utils/Sp.svelte';
	import { createRows } from './_utils.js';
</script>

<div style="align-items: flex-start">
	<Typography variant="heading-h2" style={{ paddingBottom: 'var(--atmr-spacing-3x)' }}>Добавление цвета активного узла</Typography>
	<Typography variant="body-m" style={{ paddingBottom: 'var(--atmr-spacing-3x)' }}>
		В параметре<Sp /><Typography as="span" variant="body-m" style={{ color: 'var(--atmr-accent-500)' }}>activeColor</Typography><Sp />можно указать цвет, в который окрасится узел дерева <br /> после
		клика на его текстовую часть
	</Typography>
	<Tree data={createRows(10)} checkable activeColor="rgba(119, 0, 255, 0.1)" />
</div>
