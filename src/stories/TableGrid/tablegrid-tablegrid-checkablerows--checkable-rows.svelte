<script lang="ts">
	// Story: TableGrid/TableGrid/CheckableRows (CheckableRows.stories.tsx)
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
</script>

{#snippet headerCheckbox()}
	<Checkbox
		onChange={(v) => (v ? setSelectedAll() : (selected = []))}
		checked={selected.length === DEFAULT_SELECTED_ARR.length}
		indeterminate={selected.length > 0 && DEFAULT_SELECTED_ARR.length !== selected.length}
		variant="primary"
	/>
{/snippet}

<div style="align-items: flex-start">
	<Typography variant="heading-h2" style={pb}>Выбор строк</Typography>

	<Typography variant="body-m" style={pb}
		>Задаётся параметром<Sp /><Typography as="span" variant="body-m" style={accent}>selection</Typography><Sp />в объект-параметре<Sp /><Typography as="span" variant="body-m" style={accent}>row</Typography><Sp />(см. showCode)</Typography
	>

	<Typography variant="body-m" style={pb}
		>Для того, чтобы включить выбор строк, достаточно передать в<Sp /><Typography as="span" variant="body-m" style={accent}>defaultSelected</Typography><Sp />пустой массив.<Sp /><Typography as="span" variant="body-m" style={accent}>onSelect</Typography><Sp />вернёт ключ выбранной строки</Typography
	>

	<Typography variant="body-m" style={pb}
		>Также, для того, чтобы задать общий чекбокс или любой другой контент в заголовок первой колонки, можно воспользоваться функцией<Sp /><Typography as="span" variant="body-m" style={accent}>renderFirstColumnHeader</Typography></Typography
	>

	<TableGrid
		columns={[
			{ name: 'Rasp', key: 'rasp', title: 'Распоряжение' },
			{ name: 'vls', title: 'ВЛС' },
			{ name: 'ur', title: 'УР' }
		]}
		rows={defaultRows}
		rowConfig={{
			selection: {
				defaultSelected: selected,
				onSelect: (row) => setSelectedOne(row),
				renderFirstColumnHeader: headerCheckbox
			}
		}}
	/>
</div>
