<script lang="ts">
	// Story: TableGrid/TableGrid/ActionBar -> ActionBarStory (ActionBar.stories.tsx): ready-made ActionBar + Pagination + selection of visible rows.
	import Checkbox from '$lib/components/Checkbox/Checkbox/Checkbox.svelte';
	import Pagination from '$lib/components/Pagination/Pagination.svelte';
	import ActionBar from '$lib/components/TableGrid/modules/action-bar/ActionBar.svelte';
	import TableGrid from '$lib/components/TableGrid/TableGrid.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import Sp from '../_utils/Sp.svelte';
	import AfterFonts from './_AfterFonts.svelte';
	import { PAGINATION_ROWS } from './_fixtures.js';

	const accent = { color: 'var(--atmr-accent-500)' };
	const pb = { paddingBottom: 'var(--atmr-spacing-3x)' };

	let rows = $state<any[]>(PAGINATION_ROWS);
	let selected = $state<string[]>(['0', '1', '2']);
	let page = $state(1);
	let pageSize = $state(10);

	const firstPageIndex = $derived((page - 1) * pageSize);
	const lastPageIndex = $derived(firstPageIndex + pageSize);
	const pagedRows = $derived(rows.slice(firstPageIndex, lastPageIndex));
	const visibleRowIds = $derived(pagedRows.map((row) => String(row.id)));
	const totalPages = $derived(Math.ceil(rows.length / pageSize));
	const totalLabel = $derived(`Строки ${firstPageIndex + 1}-${Math.min(lastPageIndex, rows.length)} из ${rows.length}`);
	const headerCheckbox = $derived.by(() => {
		const isAllVisibleSelected = visibleRowIds.length > 0 && visibleRowIds.every((id) => selected.includes(id));
		const isSomeVisibleSelected = visibleRowIds.some((id) => selected.includes(id));
		return { checked: isAllVisibleSelected, indeterminate: isSomeVisibleSelected && !isAllVisibleSelected };
	});

	const selectVisible = () => (selected = [...new Set([...selected, ...visibleRowIds])]);
	const deselectVisible = () => (selected = selected.filter((id) => !visibleRowIds.includes(id)));
	const clearSelection = () => (selected = []);
</script>

{#snippet headerCheck()}
	<Checkbox onChange={(v) => (v ? selectVisible() : deselectVisible())} checked={headerCheckbox.checked} indeterminate={headerCheckbox.indeterminate} variant="primary" />
{/snippet}
{#snippet actionBar()}
	<ActionBar
		onDelete={(ids) => {
			rows = rows.filter((row) => !ids.includes(String(row.id)));
			clearSelection();
		}}
		onCancel={() => clearSelection()}
	/>
{/snippet}
{#snippet footer()}
	<Pagination
		type="buttons"
		alignment="left"
		count={rows.length}
		{pageSize}
		{page}
		onPageChange={(v) => (page = v)}
		onPageSizeChange={(v) => {
			pageSize = v;
			page = 1;
		}}
		total={{ enabled: true, label: totalLabel }}
		pageSizeChanger={{ enabled: true, pageSizeOptions: [10, 20, 50] }}
		jumper={{ enabled: true, labelSuffix: `из ${totalPages}` }}
	/>
{/snippet}

<div style="align-items: flex-start">
	<Typography variant="heading-h2" style={pb}>Action Bar</Typography>

	<Typography variant="body-m" style={pb}
		>Панель действий добавляется в слот<Sp /><Typography as="span" variant="body-m" style={accent}>actionBar</Typography><Sp />объект-параметра<Sp /><Typography as="span" variant="body-m" style={accent}>renders</Typography>.
		Используйте компонент<Sp /><Typography as="span" variant="body-m" style={accent}>ActionBar</Typography><Sp />для стандартного поведения или передайте свой контент.</Typography
	>

	<AfterFonts>
		<TableGrid
			style={{ width: '1100px' }}
			containerStyle={{ maxHeight: '420px' }}
			headerSticky
			columns={[
				{ name: 'rasp', title: 'Распоряжение' },
				{ name: 'vls', title: 'ВЛС' },
				{ name: 'ur', title: 'УР' },
				{ name: 'obm', title: 'OBM' }
			]}
			rows={pagedRows}
			rowConfig={{
				selection: { defaultSelected: selected, onSelectionChange: (next) => (selected = next), renderFirstColumnHeader: headerCheck }
			}}
			renders={{ actionBar, footer }}
		/>
	</AfterFonts>
</div>
