<script lang="ts">
	// Story: TableGrid/TableGrid/Sorting (Sorting.stories.tsx): the table only shows the sort icon and reports `onSort`, the story sorts the rows
	import TableGrid from '$lib/components/TableGrid/TableGrid.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import { SORT_VARIANTS } from '$lib/components/TableGrid/constants.js';
	import { defaultRows } from './_fixtures.js';

	let tableData = $state.raw<any[]>(defaultRows);
	let activeSortColumn = $state('ur');
	let currentSortOrder = $state<string>(SORT_VARIANTS.default);

	const getNextSortOrder = (columnId: string) => {
		if (columnId !== activeSortColumn) return SORT_VARIANTS.asc;
		const sortOrderSequence: Record<string, string> = { asc: 'desc', desc: 'default', default: 'asc' };
		return sortOrderSequence[currentSortOrder] || SORT_VARIANTS.asc;
	};
	const sortData = (data: any[], columnId: string, order: string) => {
		if (order === SORT_VARIANTS.default) return defaultRows;
		const sortMultiplier = order === SORT_VARIANTS.asc ? 1 : -1;
		return [...data].sort((a, b) => {
			if (a[columnId] === b[columnId]) return 0;
			return a[columnId] < b[columnId] ? -sortMultiplier : sortMultiplier;
		});
	};
	const handleColumnSort = (columnId: string) => () => {
		const nextSortOrder = getNextSortOrder(columnId);
		activeSortColumn = columnId;
		currentSortOrder = nextSortOrder;
		tableData = sortData(tableData, columnId, nextSortOrder);
	};
	const getSortingProps = (columnId: string) => ({
		sort: (columnId === activeSortColumn ? currentSortOrder : SORT_VARIANTS.default) as 'asc' | 'desc' | 'default',
		onSort: handleColumnSort(columnId)
	});
</script>

<div style="align-items: flex-start; width: 100%">
	<Typography variant="heading-h2" style={{ paddingBottom: 'var(--atmr-spacing-3x)' }}>Сортировка по одному столбцу</Typography>

	<TableGrid
		columnConfig={{ sorting: true }}
		columns={[
			{ name: 'rasp', title: 'Распоряжение', sorting: getSortingProps('rasp') },
			{ name: 'vls', title: 'ВЛС' },
			{ name: 'ur', title: 'УР', sorting: getSortingProps('ur') }
		]}
		rows={tableData}
	/>
</div>
