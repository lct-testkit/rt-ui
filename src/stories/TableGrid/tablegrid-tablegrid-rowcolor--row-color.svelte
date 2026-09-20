<script lang="ts">
	// Story: TableGrid/TableGrid/RowColor (RowColor.stories.tsx)
	import Checkbox from '$lib/components/Checkbox/Checkbox/Checkbox.svelte';
	import TableGrid from '$lib/components/TableGrid/TableGrid.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import Sp from '../_utils/Sp.svelte';
	import { defaultRows } from './_fixtures.js';

	const accent = { color: 'var(--atmr-accent-500)' };
	const pb = { paddingBottom: 'var(--atmr-spacing-3x)' };
	const DEFAULT_SELECTED_ARR = Array.from({ length: defaultRows.length }, (_, i) => (i + 1).toString());

	let selected = $state<string[]>(['2']);
	const setSelectedAll = () => {
		selected = DEFAULT_SELECTED_ARR;
	};
	const setSelectedOne = (key: string) => {
		selected = selected.includes(key) ? selected.filter((item) => item !== key) : [...selected, key];
	};

	const ROWS_COLOR_MAP: Record<string, string> = { 1: 'red', 2: 'orange', 3: 'yellow', 4: 'green', 5: 'teal' };
	const handleColorRow = (rowData: any) => (rowData.id % 2 === 0 ? 'var(--atmr-bg-surface4)' : '');
</script>

{#snippet headerCheckbox()}
	<Checkbox
		onChange={(v) => (v ? setSelectedAll() : (selected = []))}
		checked={selected.length === DEFAULT_SELECTED_ARR.length}
		indeterminate={selected.length > 0 && DEFAULT_SELECTED_ARR.length !== selected.length}
	/>
{/snippet}

<div style="align-items: flex-start">
	<Typography variant="heading-h2" style={pb}>Цвет строки</Typography>

	<Typography variant="body-m" style={pb}
		>Задается с помощью параметра<Sp /><Typography as="span" variant="body-m" style={accent}>backgroundColor</Typography><Sp />в объект-параметре row<Sp /></Typography
	>

	<Typography variant="body-m" style={pb}
		>Также можно задать цвет строки при клике на неё. Включается параметром<Sp /><Typography as="span" variant="body-m" style={accent}>highlightOnClick</Typography></Typography
	>

	<Typography variant="body-m" style={pb}
		>В параметры<Sp /><Typography as="span" variant="body-m" style={accent}>highlightColor</Typography><Sp />и<Sp /><Typography as="span" variant="body-m" style={accent}>backgroundColor</Typography><Sp />можно передать как строку с цветом, так и функцию, принимающую данные строки и возвращающую цвет</Typography
	>

	<TableGrid
		columns={[
			{ name: 'rasp', title: 'Распоряжение' },
			{ name: 'vls', title: 'ВЛС' },
			{ name: 'ur', title: 'УР' }
		]}
		rowConfig={{
			backgroundColor: (row) => handleColorRow(row),
			highlightColor: (row) => ROWS_COLOR_MAP[row.id],
			highlightOnClick: true,
			selection: {
				defaultSelected: selected,
				onSelect: (row) => setSelectedOne(row),
				renderFirstColumnHeader: headerCheckbox
			}
		}}
		rows={defaultRows}
	/>
</div>
