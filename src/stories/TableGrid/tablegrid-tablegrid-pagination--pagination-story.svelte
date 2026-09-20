<script lang="ts">
	// Story: TableGrid/TableGrid/Pagination -> PaginationStory (Pagination.stories.tsx): Pagination in the `footer` slot, inline operators filter of the
	// first column, custom `emptyTable` when the filter matches nothing.
	import Button from '$lib/components/Button/Button/Button.svelte';
	import Pagination from '$lib/components/Pagination/Pagination.svelte';
	import TableGrid from '$lib/components/TableGrid/TableGrid.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import Sp from '../_utils/Sp.svelte';
	import AfterFonts from './_AfterFonts.svelte';
	import { PAGINATION_ROWS } from './_fixtures.js';

	const accent = { color: 'var(--atmr-accent-500)' };
	const pb = { paddingBottom: 'var(--atmr-spacing-3x)' };

	let filterValueRasp = $state('');
	let page = $state(1);
	let pageSize = $state(10);

	const allRows = PAGINATION_ROWS;
	const filteredRows = $derived(filterValueRasp ? allRows.filter((it) => it.rasp.includes(filterValueRasp)) : allRows);
	$effect(() => {
		if ((page - 1) * pageSize >= filteredRows.length && filteredRows.length > 0) page = 1;
	});
	const firstPageIndex = $derived((page - 1) * pageSize);
	const lastPageIndex = $derived(firstPageIndex + pageSize);
	const pagedRows = $derived(filteredRows.slice(firstPageIndex, lastPageIndex));
	const totalLabel = $derived(filteredRows.length > 0 ? `Строки ${firstPageIndex + 1}-${Math.min(lastPageIndex, filteredRows.length)} из ${filteredRows.length}` : 'Строки 0');
	const totalPages = $derived(Math.ceil(filteredRows.length / pageSize));

	const filterRasp = (value: string) => {
		filterValueRasp = value;
		page = 1;
	};
</script>

<!-- React renders "Задаётся отдельным компонентом ", "<Pagination />" and ", импортируется ..." as three text nodes -->
{#snippet componentName()}{'<Pagination />'}{/snippet}
{#snippet footer()}
	<Pagination
		type="buttons"
		alignment="left"
		count={filteredRows.length === 0 ? 1 : filteredRows.length}
		{pageSize}
		{page}
		onPageChange={(v) => (page = v)}
		onPageSizeChange={(v) => {
			pageSize = v;
			page = 1;
		}}
		total={{ enabled: !!totalLabel, label: totalLabel }}
		pageSizeChanger={{ enabled: true, pageSizeOptions: [10, 20, 50, 100] }}
		jumper={{ enabled: true, labelSuffix: `из ${totalPages === 0 ? 1 : totalPages}` }}
	/>
{/snippet}
{#snippet emptyTable()}
	<div style="text-align: center; padding: var(--atmr-spacing-7x); display: flex; flex-direction: column">
		<Typography variant="heading-h4" style={{ color: 'var(--atmr-light-fg-default)', marginBottom: 'var(--atmr-spacing-2x)' }}>Совпадений не найдено</Typography>
		<Typography variant="body-s" style={{ color: 'var(--atmr-light-fg-muted)', marginBottom: 'var(--atmr-spacing-6x)' }}>Попробуйте изменить настройки поиска</Typography>
		<Button label="Сбросить фильтры" variant="ghost" onclick={() => filterRasp('')} />
	</div>
{/snippet}

<div style="align-items: flex-start">
	<Typography variant="heading-h2" style={pb}>Постраничная навигация</Typography>

	<Typography variant="body-m" style={pb}
		>Задаётся отдельным компонентом {@render componentName()}, импортируется в проект из '@atomaro/ui-kit/components/Pagination/Pagination' и добавляется в<Sp /><Typography
			as="span"
			variant="body-m"
			style={accent}>footer</Typography
		><Sp />объект-параметра<Sp /><Typography as="span" variant="body-m" style={accent}>renders</Typography><Sp /><br />Пропсы для компонента Pagination можно посмотреть в типах самого элемента и в<Sp /><a
			href="https://design.rt.ru/gen2/react-storybook/?path=/docs/components-pagination--docs"
			target="_blank"
			rel="noreferrer">сторибуке</a
		></Typography
	>

	<AfterFonts>
		<TableGrid
			style={{ width: '1100px' }}
			columnConfig={{ filter: true, resize: true }}
			columns={[
				{ name: 'rasp', title: 'Распоряжение', filter: { type: 'operators', position: 'inline', onFilter: (value) => filterRasp(value), value: filterValueRasp } },
				{ name: 'vls', title: 'ВЛС' },
				{ name: 'ur', title: 'УР' },
				{ name: 'obm', title: 'OBM' }
			]}
			rows={pagedRows}
			footerSticky
			renders={{ footer, emptyTable: filteredRows.length === 0 ? emptyTable : undefined }}
		/>
	</AfterFonts>
</div>
