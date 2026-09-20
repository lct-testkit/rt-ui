<script lang="ts">
	// Story: TableGrid/TableGrid/PaginationWithStickyScroll (PaginationWithStickyScroll.stories.tsx): like StickyHeaderAndFooter, columns with sorting,
	// Pagination without the "total" label; the rows of a page are random items of SURTS_DATA (Math.random is seeded by the harness).
	/* eslint-disable @typescript-eslint/no-explicit-any */
	import Pagination from '$lib/components/Pagination/Pagination.svelte';
	import TableGrid from '$lib/components/TableGrid/TableGrid.svelte';
	import AfterFonts from './_AfterFonts.svelte';
	import { FIRST_TABLE, SECOND_TABLE, skipReactRandom, SURTS_DATA, THIRD_TABLE } from './_fixtures.js';

	const columnConfig = { sorting: true, filter: true, move: true, resize: true };
	const noop = () => {};
	const columns = FIRST_TABLE.map((column) => ({
		...column,
		name: column.name,
		title: column.title,
		size: { width: column.width },
		sorting: { sort: column.sort, onSort: noop }
	}));

	skipReactRandom();
	let page = $state(1);
	let pageSize = $state(10);
	const data = $derived(
		Array.from(Array(pageSize).keys()).map((id) => {
			const item = SURTS_DATA[Math.floor(Math.random() * SURTS_DATA.length)];
			return { ...item, id: `${id}${page}` };
		})
	);
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

{#snippet footer()}
	<Pagination
		type="buttons"
		alignment="left"
		count={200}
		{pageSize}
		{page}
		onPageChange={(v) => (page = v)}
		onPageSizeChange={(v) => (pageSize = v)}
		pageSizeChanger={{ enabled: true, pageSizeOptions: [10, 20, 50, 100] }}
		jumper={{ enabled: true, labelSuffix: 'из 100' }}
	/>
{/snippet}

<div style="align-items: flex-start">
	<AfterFonts>
		<TableGrid
			size="m"
			containerStyle={{ width: '1000px', maxHeight: '500px' }}
			nestedOffset={0}
			id="table1"
			{columns}
			{columnConfig}
			footerSticky
			headerSticky
			addonSticky
			onCollsResize={noop}
			onCollsSwap={noop}
			rowConfig={{
				highlightOnClick: true,
				onClick: noop,
				onDoubleClick: noop,
				expand: { hasExpanded: (row) => row?.threads?.length > 0, render: expandLevel1 }
			}}
			renders={{ footer }}
			rows={data}
		/>
	</AfterFonts>
</div>
