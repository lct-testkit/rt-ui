<script lang="ts">
	// Story: TableGrid/TableGrid (TableGrid.stories.tsx) - three nested tables (expandable rows), sorting / filter / move / resize on.
	import TableGrid from '$lib/components/TableGrid/TableGrid.svelte';
	import { FIRST_TABLE, SECOND_TABLE, THIRD_TABLE, SURTS_DATA } from './_fixtures.js';

	const columnConfig = { sorting: true, filter: true, move: true, resize: true };
	const noop = () => {};

	const columns = FIRST_TABLE.map((column) => ({
		...column,
		name: column.name,
		title: column.title,
		size: { width: column.width },
		sorting: { sort: column.sort, onSort: noop }
	}));
</script>

{#snippet expandLevel1(rowData1: any)}
	<div style="width: 100%">
		<TableGrid
			id="table2"
			size="m"
			{columnConfig}
			less
			nestedOffset={1}
			columns={SECOND_TABLE.map((column) => ({ ...column, name: column.name, title: column.title, size: { width: column.width, min: 80, max: 300 } }))}
			rows={rowData1?.threads}
			rowConfig={{ expand: { hasExpanded: (data) => data?.threadLoadingInfo?.length > 0, render: expandLevel2 } }}
		/>
	</div>
{/snippet}

{#snippet expandLevel2(rowData2: any)}
	<TableGrid
		id="table3"
		{columnConfig}
		less
		nestedOffset={2}
		columns={THIRD_TABLE.map((column) => ({ ...column, name: column.name, title: column.title, size: { width: column.width } }))}
		rows={rowData2?.threadLoadingInfo}
	/>
{/snippet}

<div style="align-items: flex-start">
	<TableGrid
		nestedOffset={0}
		id="table1"
		size="m"
		{columns}
		rows={SURTS_DATA}
		{columnConfig}
		onCollsResize={noop}
		onCollsSwap={noop}
		rowConfig={{
			highlightOnClick: true,
			onClick: noop,
			onDoubleClick: noop,
			expand: { hasExpanded: (data) => data?.threads?.length > 0, render: expandLevel1 }
		}}
		containerStyle={{ width: '1000px', maxHeight: '500px' }}
	/>
</div>
