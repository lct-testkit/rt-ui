<script lang="ts">
	// Story: TableGrid/TableGrid/TableSize (TableSize.stories.tsx)
	import TableGrid from '$lib/components/TableGrid/TableGrid.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import Sp from '../_utils/Sp.svelte';
	import { defaultRows } from './_fixtures.js';

	const accent = { color: 'var(--atmr-accent-500)' };
	const columns = [
		{ name: 'rasp', title: 'Распоряжение' },
		{ name: 'vls', title: 'ВЛС' },
		{ name: 'ur', title: 'УР' }
	];
</script>

<div style="align-items: flex-start; width: 100%">
	<Typography variant="heading-h2" style={{ paddingBottom: 'var(--atmr-spacing-3x)' }}>Размер таблицы</Typography>

	<Typography variant="body-m"
		>Параметр<Sp /><Typography as="span" variant="body-m" style={accent}>size</Typography><Sp />имеет 2 значения:<Sp /><Typography as="span" variant="body-m" style={accent}>s</Typography><Sp />и<Sp /><Typography as="span" variant="body-m" style={accent}>m</Typography></Typography
	>

	<Typography variant="heading-h3" style={{ paddingBottom: 'var(--atmr-spacing-3x)', paddingTop: 'var(--atmr-spacing-3x)' }}>Маленькая таблица</Typography>

	<TableGrid {columns} rows={defaultRows} size="s" />

	<Typography variant="heading-h3" style={{ paddingBottom: 'var(--atmr-spacing-3x)', paddingTop: 'var(--atmr-spacing-3x)' }}>Большая таблица</Typography>

	<TableGrid {columns} rows={defaultRows} size="m" />
</div>
