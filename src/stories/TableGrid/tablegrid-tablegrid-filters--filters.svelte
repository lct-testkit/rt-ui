<script lang="ts">
	// Story: TableGrid/TableGrid/Filters (Filters.stories.tsx), initial arg `size: 'm'`
	// operator filter (inline), select filter (popover), select filter (inline), custom filters (popover / inline).
	import Button from '$lib/components/Button/Button/Button.svelte';
	import TableGrid from '$lib/components/TableGrid/TableGrid.svelte';
	import type { TableGridColumn } from '$lib/components/TableGrid/types';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import AfterFonts from './_AfterFonts.svelte';
	import { defaultRows } from './_fixtures.js';

	const SELECT_OPTIONS = [
		{ key: '22-2-50-6897-1', value: '22-2-50-6897-1' },
		{ key: '20-2-50-6897-1', value: '20-2-50-6897-1' },
		{ key: '12-2-50-6897-1', value: '12-2-50-6897-1' },
		{ key: '13-2-50-6897-1', value: '13-2-50-6897-1' },
		{ key: '10-2-50-6897-1', value: '10-2-50-6897-1' }
	];
	const SELECT_OPTIONS_2 = [
		{ key: 'Организация', value: 'Организация' },
		{ key: 'Физическое лицо', value: 'Физическое лицо' }
	];

	let rows = $state.raw<any[]>(defaultRows);
	let filterValueVls = $state('');
	let filterValueRasp = $state('');
	let filterValueUr = $state('');

	const handleClear = () => {
		rows = defaultRows;
		filterValueVls = '';
		filterValueRasp = '';
		filterValueUr = '';
	};
	const filterVls = (value: string) => {
		filterValueVls = value;
		rows = [...defaultRows].filter((it) => !value || (value && it.vls.includes(value)));
	};
	const filterRasp = (value: string) => {
		filterValueRasp = value;
		rows = [...defaultRows].filter((it) => !value || (value && it.rasp === value));
	};
	const filterUr = (value: string) => {
		filterValueUr = value;
		rows = [...defaultRows].filter((it) => !value || (value && it.ur === value));
	};

	const columns = $derived<TableGridColumn[]>([
		{
			name: 'vls',
			title: 'ВЛС',
			filter: { type: 'operators', position: 'inline', onFilter: (value) => filterVls(value), value: filterValueVls }
		},
		{
			name: 'rasp',
			title: 'Распоряжение',
			filter: { type: 'select', position: 'popover', options: SELECT_OPTIONS, onFilter: (value) => filterRasp(value), value: filterValueRasp },
			size: { min: 100 }
		},
		{
			name: 'ur',
			title: 'УР',
			filter: { type: 'select', position: 'inline', options: SELECT_OPTIONS_2, onFilter: (value) => filterUr(value), value: filterValueUr }
		},
		{ name: 'ur 2', key: 'ur', title: 'Custom Popover Filter', filter: { render: popoverFilter, position: 'popover', onFilter: () => {}, value: '' } },
		{ name: 'ur 3', key: 'ur', title: 'Custom Inline Filter', filter: { render: inlineFilter, position: 'inline', onFilter: () => {}, value: '' } }
	]);
</script>

{#snippet popoverFilter()}
	<Typography variant="body-m">Filter Content</Typography>
{/snippet}
{#snippet inlineFilter()}
	<Typography variant="body-m" style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>Filter Content</Typography>
{/snippet}

<div style="align-items: flex-start; width: 100%">
	<Typography variant="heading-h2" style={{ paddingBottom: 'var(--atmr-spacing-3x)' }}>Фильтр</Typography>

	<Button size="m" style="margin-bottom: var(--atmr-spacing-3x)" onclick={handleClear} label="Очистить фильтр" />

	<AfterFonts>
		<TableGrid size="m" columnConfig={{ filter: true, resize: true }} {columns} {rows} />
	</AfterFonts>
</div>
