<script lang="ts">
	// Story: Tree/Tree/HideBorders (HideBorders.stories.tsx; story decorator: <div style="align-items: flex-start">)
	import Tree from '$lib/components/Tree/Tree.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import Sp from '../_utils/Sp.svelte';
	import { createRows } from './_utils.js';
</script>

<div style="align-items: flex-start">
	<Typography variant="heading-h2" style={{ paddingBottom: 'var(--atmr-spacing-3x)' }}>Выключение бордеров</Typography>

	<Typography variant="body-m" style={{ paddingBottom: 'var(--atmr-spacing-3x)' }}>
		Управляется параметром<Sp /><Typography as="span" variant="body-m" style={{ color: 'var(--atmr-accent-500)' }}>hideBorders</Typography>
	</Typography>

	<Tree data={createRows(3)} hideBorders expandedKeys={['0-0', '0-0-0']} />
</div>
