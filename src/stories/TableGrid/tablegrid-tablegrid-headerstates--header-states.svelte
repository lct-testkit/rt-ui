<script lang="ts">
	// Story: TableGrid/TableGrid/HeaderStates (HeaderStates.stories.tsx), initial arg `size: 'm'`.
	import TableGrid from '$lib/components/TableGrid/TableGrid.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import AfterFonts from './_AfterFonts.svelte';

	const noop = () => {};
	const columnConfig = { sorting: true, filter: true, move: true, resize: true };
	const containerStyle = { width: '100%', maxHeight: '500px', overflowX: 'auto' };
	const sorting = { sort: 'default' as const, onSort: noop };
	const selectFilter = { type: 'select' as const, onFilter: noop };
	const selectInline = { type: 'select' as const, position: 'inline' as const, onFilter: noop };
	const operatorsInline = { type: 'operators' as const, position: 'inline' as const, onFilter: noop };

	const leftColumns = [
		// LEFT ALIGN - with a filter
		{ name: 'col1', title: 'Column Header', align: 'left' as const, textWrap: false, sorting, filter: selectFilter, size: { width: '200px' } },
		{ name: 'col2', title: 'Column Header', align: 'left' as const, textWrap: false, unit: 'Unit Text', sorting, filter: selectFilter, size: { width: '200px' } },
		// LEFT ALIGN - with an inline filter
		{ name: 'col3', title: 'Column Header', align: 'left' as const, textWrap: false, filter: operatorsInline, size: { width: '200px' } },
		{ name: 'col4', title: 'Column Header', align: 'left' as const, textWrap: false, sorting, filter: operatorsInline, size: { width: '200px' } },
		// LEFT ALIGN - with textWrap
		{ name: 'col5', title: 'Column Header With Long Text That Should Wrap', align: 'left' as const, textWrap: true, size: { width: '150px' } },
		{ name: 'col5a', title: 'Text - Wrap', align: 'left' as const, textWrap: true, size: { width: '160px' }, sorting, filter: selectFilter },
		{ name: 'col5c', title: 'Text - Wrap', align: 'left' as const, textWrap: true, size: { width: '200px' }, sorting, filter: selectInline }
	];

	const rightColumns = [
		// RIGHT ALIGN - with a filter
		{ name: 'col6', title: 'Column Header', align: 'right' as const, textWrap: false, sorting, filter: selectFilter, size: { width: '200px' } },
		{ name: 'col7', title: 'Column Header', align: 'right' as const, textWrap: false, unit: 'Unit Text', sorting, filter: selectFilter, size: { width: '200px' } },
		// RIGHT ALIGN - with an inline filter
		{ name: 'col8', title: 'Column Header', align: 'right' as const, textWrap: false, filter: operatorsInline, size: { width: '200px' } },
		{ name: 'col9', title: 'Column Header', align: 'right' as const, textWrap: false, sorting, filter: operatorsInline, size: { width: '200px' } },
		// RIGHT ALIGN - with textWrap
		{ name: 'col10', title: 'Column Header With Long Text That Should Wrap', align: 'right' as const, textWrap: true, size: { width: '150px' } },
		{ name: 'col10a', title: 'Text - Wrap', align: 'right' as const, textWrap: true, size: { width: '160px' }, sorting, filter: selectFilter },
		{ name: 'col10c', title: 'Text - Wrap', align: 'right' as const, textWrap: true, size: { width: '200px' }, sorting, filter: selectInline }
	];
</script>

<div style="align-items: flex-start">
	<Typography variant="heading-h2" style={{ paddingBottom: 'var(--atmr-spacing-3x)' }}>Все состояния заголовков колонок</Typography>

	<Typography variant="body-m" style={{ paddingBottom: 'var(--atmr-spacing-3x)' }}
		>Демонстрация возможных комбинаций выравнивания, переноса текста, единиц измерения, сортировки и фильтрации</Typography
	>

	<Typography variant="body-m" style={{ paddingBottom: 'var(--atmr-spacing-3x)' }}>Align: left</Typography>

	<AfterFonts>
		<TableGrid {columnConfig} columns={leftColumns} rows={[]} {containerStyle} size="m" />
	</AfterFonts>

	<Typography variant="body-m" style={{ paddingTop: 'var(--atmr-spacing-3x)', paddingBottom: 'var(--atmr-spacing-3x)' }}>Align: right</Typography>

	<AfterFonts>
		<TableGrid {columnConfig} columns={rightColumns} rows={[]} {containerStyle} size="m" />
	</AfterFonts>
</div>
