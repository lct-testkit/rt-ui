<script lang="ts">
	// Port of `NewVirtualRender` of packages/tablegird (shared/modules/rows/hooks/useRenderRows.tsx): the rows of the Tree in a virtual list -
	// react-virtualized `AutoSizer` (fills the parent element) > `List` > one `CellMeasurer` per row. The row state is the state of the flat
	// rows context, but `isStart` / `isEnd` mark the first / last row of the WHOLE list.
	import type { Snippet } from 'svelte';
	import RowProvider from '../../../TableGrid/modules/row/_RowProvider.svelte';
	import { useRows } from '../../../TableGrid/modules/rows/rows.svelte.js';
	import AutoSizer from './_AutoSizer.svelte';
	import { CellMeasurerCache } from './CellMeasurerCache.js';
	import MeasuredCell from './_MeasuredCell.svelte';
	import VirtualList from './_VirtualList.svelte';

	let { rowContent }: { rowContent?: Snippet } = $props();

	const rows = useRows();
	// useMemo(() => new CellMeasurerCache({ minHeight: 40, fixedWidth: true }), [])
	const cache = new CellMeasurerCache({ minHeight: 40, fixedWidth: true });
</script>

<AutoSizer>
	{#snippet children({ height, width })}
		<VirtualList {height} {width} rowCount={rows.rows.length} {cache}>
			{#snippet row(cell, parent)}
				<RowProvider row={{ ...rows.rows[cell.index], isStart: cell.index === 0, isEnd: cell.index === rows.rows.length - 1 }}>
					<MeasuredCell {cache} rowIndex={cell.index} {parent} style={cell.style}>{@render rowContent?.()}</MeasuredCell>
				</RowProvider>
			{/snippet}
		</VirtualList>
	{/snippet}
</AutoSizer>
