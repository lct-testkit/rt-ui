<script lang="ts">
	// Port of the `Rows` component of packages/tablegird (shared/modules/rows/components/Rows.tsx) as the Tree uses it (`component: 'tree'`):
	// the flat list of the rows context (the children of expanded nodes follow their parent), one `RowProvider` per row with the row
	// renderer (`children`) inside. No expand containers (the tree indents its children itself).
	//   default : `{#each}` over the rows
	//   virtual : `virtualScroll.isEnable` -> the react-virtualized List (AutoSizer + CellMeasurer) of ../virtual, which fills its parent
	//             (React uses react-virtualized here; the TableGrid's own `_TableBody` uses virtua, whose DOM differs from the reference)
	import type { Snippet } from 'svelte';
	import RowProvider from '../../../TableGrid/modules/row/_RowProvider.svelte';
	import { useRows } from '../../../TableGrid/modules/rows/rows.svelte.js';
	import VirtualRows from '../virtual/_VirtualRows.svelte';

	let { children }: { children?: Snippet } = $props();

	const rows = useRows();
</script>

{#if rows.virtual?.isEnable}
	<VirtualRows rowContent={children} />
{:else}
	{#each rows.rows as row (row.key ?? row.id)}
		<RowProvider {row}>{@render children?.()}</RowProvider>
	{/each}
{/if}
