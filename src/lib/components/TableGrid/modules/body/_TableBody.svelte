<script lang="ts">
	// Port of shared/modules/rows/components/Rows.tsx (+ hooks/useRenderRows): renders the list of rows of the rows context.
	// `children` is the row renderer (React: `<Rows><Row /></Rows>`; the Tree component passes its own row).
	//   default  : one `RowProvider` (+ `TableRow`) per row, expandable rows are followed by their expand container;
	//              `component: 'tree'` renders no expand containers (the tree indents its children itself);
	//   virtual  : `virtual: { isEnable: true, overscanCount }` -> only the visible window of the rows is rendered (../virtual/_VirtualRows.svelte;
	//              the React TableGrid has no virtual mode, React only wires it for the Tree, which has its own list: Tree/modules/virtual).
	import type { Snippet } from 'svelte';
	import ExpandContainer from '../expand/_ExpandContainer.svelte';
	import RowProvider from '../row/_RowProvider.svelte';
	import { useRows } from '../rows/rows.svelte.js';
	import VirtualRows from '../virtual/_VirtualRows.svelte';

	let { children }: { children?: Snippet } = $props();

	const rows = useRows();
</script>

{#if rows.virtual?.isEnable && rows.component !== 'tree'}
	<VirtualRows {children} />
{:else}
	{#each rows.rows as row (row.key ?? row.id)}
		<RowProvider {row}>{@render children?.()}</RowProvider>
		{#if rows.component !== 'tree' && row.isExpandable}
			<RowProvider {row}><ExpandContainer /></RowProvider>
		{/if}
	{/each}
{/if}
