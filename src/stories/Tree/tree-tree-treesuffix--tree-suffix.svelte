<script lang="ts">
	// Story: Tree/Tree/TreeSuffix (TreeSuffix.stories.tsx)
	import IconButton from '$lib/components/Button/IconButton/IconButton.svelte';
	import Tree from '$lib/components/Tree/Tree.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import MenuKebab from '$lib/icons/16/navigation/MenuKebab16.svelte';
	import { createRows } from './_utils.js';
</script>

{#snippet textSuffix()}
	<Typography variant="body-s" style={{ opacity: 0.5, marginRight: 'var(--atmr-spacing-3x)' }}>Text</Typography>
{/snippet}

{#snippet buttonSuffix()}
	<IconButton colorScheme="neutral" size="s" variant="ghost" style="margin-right: var(--atmr-spacing-3x)">
		{#snippet icon()}<MenuKebab />{/snippet}
	</IconButton>
{/snippet}

<div style="display: flex; justify-content: space-between; gap: 30px; min-width: 100%">
	<div style="flex: 1 1 0%">
		<Tree data={createRows(10)} itemSuffix={textSuffix} />
	</div>
	<div style="flex: 1 1 0%">
		<Tree data={createRows(10)} itemSuffix={buttonSuffix} />
	</div>
</div>
