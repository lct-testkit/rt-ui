<script lang="ts">
	// S3: TableGrid + Pagination (+ its page-size Select). URL params: ?rows=100|1000|10000 &mode=all|paged|virtual
	//   all     - every row is in the DOM (the page scrolls inside the table container)
	//   paged   - 20 rows per page through the ui-kit Pagination
	//   virtual - TableGrid `virtual`: only the visible window of the rows is in the DOM (see TableGrid/modules/virtual). Needs a table height
	//             (`containerStyle.maxHeight`, like every mode here); no pagination footer (paging and virtual scrolling exclude each other)
	// 8 columns, sorting (amount), row selection with a "select all" checkbox, every 10th row is expandable.
	import { TableGrid, type TableGridColumn } from '@rt-ui/components/TableGrid/index.ts';
	import Pagination from '@rt-ui/components/Pagination/Pagination.svelte';
	import Checkbox from '@rt-ui/components/Checkbox/Checkbox/Checkbox.svelte';
	import { makeRows } from '../../shared/data.js';

	const q = new URLSearchParams(location.search);
	const N = Number(q.get('rows') ?? 1000);
	const mode = q.get('mode') ?? 'all';

	const all = makeRows(N);
	let sort = $state<'asc' | 'desc' | 'default'>('default');
	let page = $state(1);
	let pageSize = $state(mode === 'paged' ? 20 : N);
	let selected = $state.raw<string[]>([]);

	const sorted = $derived(sort === 'default' ? all : [...all].sort((a, b) => (sort === 'asc' ? a.amount - b.amount : b.amount - a.amount)));
	const from = $derived((page - 1) * pageSize);
	const rows = $derived(mode === 'paged' ? sorted.slice(from, from + pageSize) : sorted);

	const nextSort = () => (sort = sort === 'default' ? 'asc' : sort === 'asc' ? 'desc' : 'default');
	const columns: TableGridColumn[] = $derived([
		{ name: 'id', title: '№', size: { width: 80 } },
		{ name: 'name', title: 'Клиент', size: { width: 200 } },
		{ name: 'company', title: 'Организация', size: { width: 200 } },
		{ name: 'city', title: 'Город', size: { width: 160 } },
		{ name: 'status', title: 'Статус', size: { width: 140 } },
		{ name: 'amount', title: 'Сумма', unit: '₽', align: 'right', size: { width: 140 }, sorting: { sort, onSort: nextSort } },
		{ name: 'date', title: 'Дата', size: { width: 120 } },
		{ name: 'phone', title: 'Телефон', size: { width: 180 } }
	]);
</script>

{#snippet selectAll()}
	<Checkbox
		id="select-all"
		variant="primary"
		checked={selected.length === N}
		indeterminate={selected.length > 0 && selected.length < N}
		onChange={(v: boolean) => (selected = v ? all.map((r) => String(r.id)) : [])}
	/>
{/snippet}
{#snippet details(row: any)}<div style="padding: 12px 16px">Заказы клиента {row.name}: 3 позиции</div>{/snippet}
{#snippet footer()}
	<Pagination
		type="buttons"
		alignment="left"
		count={N}
		{pageSize}
		{page}
		onPageChange={(p: number) => (page = p)}
		onPageSizeChange={(size: number) => {
			pageSize = size;
			page = 1;
		}}
		total={{ enabled: true, label: `Строки ${from + 1}-${Math.min(from + pageSize, N)} из ${N}` }}
		pageSizeChanger={{ enabled: true, pageSizeOptions: [20, 50, 100] }}
	/>
{/snippet}

<div style="padding: 16px">
	<TableGrid
		id="bench"
		{columns}
		{rows}
		columnConfig={{ sorting: true }}
		headerSticky
		containerStyle={{ maxHeight: 600 }}
		virtual={mode === 'virtual' ? { isEnable: true, overscanCount: 5 } : undefined}
		rowConfig={{
			selection: { defaultSelected: selected, onSelectionChange: (keys: string[]) => (selected = keys), renderFirstColumnHeader: selectAll },
			expand: { hasExpanded: (row: any) => row.id % 10 === 0, render: details }
		}}
		renders={{ footer: mode === 'virtual' ? undefined : footer }}
	/>
</div>
