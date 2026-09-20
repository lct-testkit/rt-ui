<script lang="ts">
	// Story: Tree/Tree/TreeIcons (TreeIcons.stories.tsx; story decorator: a div with align-items: flex-start)
	import Tree from '$lib/components/Tree/Tree.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import AddSmall from '$lib/icons/24/action/AddSmall.svelte';
	import RemoveSmall from '$lib/icons/24/action/RemoveSmall.svelte';
	import DocumentText from '$lib/icons/24/document/DocumentText.svelte';
	import Folder from '$lib/icons/24/document/Folder.svelte';
	import FolderOpen from '$lib/icons/24/document/FolderOpen.svelte';
	import Rating from '$lib/icons/24/rating/Rating.svelte';
	import Sp from '../_utils/Sp.svelte';
	import { createRows } from './_utils.js';

	const accent = { color: 'var(--atmr-accent-500)' };
</script>

{#snippet addSmall()}<AddSmall />{/snippet}
{#snippet removeSmall()}<RemoveSmall />{/snippet}
{#snippet folder()}<Folder />{/snippet}
{#snippet folderOpen()}<FolderOpen />{/snippet}
{#snippet document()}<DocumentText />{/snippet}
{#snippet rating()}<Rating />{/snippet}
{#snippet suffix()}<div>Text</div>{/snippet}

<div style="align-items: flex-start">
	<Typography variant="heading-h2" style={{ paddingBottom: 'var(--atmr-spacing-3x)' }}>Изменение иконок</Typography>

	<Typography variant="body-m" style={{ paddingBottom: 'var(--atmr-spacing-3x)' }}>
		Параметры<Sp /><Typography as="span" variant="body-m" style={accent}>collapsedIcon</Typography><Sp />и<Sp /><Typography as="span" variant="body-m" style={accent}>expandedIcon</Typography>
	</Typography>

	<Tree data={createRows(6)} collapsedIcon={addSmall} expandedIcon={removeSmall} />

	<Typography variant="body-m" style={{ paddingBottom: 'var(--atmr-spacing-3x)', paddingTop: 'var(--atmr-spacing-3x)' }}>
		Параметры<Sp /><Typography as="span" variant="body-m" style={accent}>parentCollapsedIcon</Typography>,<Sp /><Typography as="span" variant="body-m" style={accent}
			>parentExpandedIcon</Typography
		><Sp />и<Sp /><Typography as="span" variant="body-m" style={accent}>childIcon</Typography>
	</Typography>

	<Tree data={createRows(1)} parentCollapsedIcon={folder} parentExpandedIcon={folderOpen} childIcon={document} expandedKeys={['0-0-0', '0-0']} />

	<Typography variant="body-m" style={{ paddingBottom: 'var(--atmr-spacing-3x)', paddingTop: 'var(--atmr-spacing-3x)' }}>Отдельная иконка для конкретного элемента</Typography>

	<Tree
		data={[...createRows(3), { id: 'id656544', key: 'id656544', title: 'parent 5', name: 'parent 5', state: { expanded: false }, icon: rating, children: [] }]}
		itemSuffix={suffix}
	/>
</div>
