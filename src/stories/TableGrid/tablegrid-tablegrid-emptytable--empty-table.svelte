<script lang="ts">
	// Story: TableGrid/TableGrid/EmptyTable (EmptyTable.stories.tsx)
	import Button from '$lib/components/Button/Button/Button.svelte';
	import TableGrid from '$lib/components/TableGrid/TableGrid.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import Sp from '../_utils/Sp.svelte';

	const accent = { color: 'var(--atmr-accent-500)' };
	const columns = [
		{ name: 'rasp', title: 'Распоряжение', size: { width: '200px' } },
		{ name: 'vls', title: 'ВЛС', size: { width: '200px' } },
		{ name: 'ur', title: 'УР', size: { width: '200px' } }
	];
</script>

{#snippet emptyTable()}
	<div style="text-align: center; padding: var(--atmr-spacing-7x); display: flex; flex-direction: column">
		<Typography variant="heading-h4" style={{ color: 'var(--atmr-light-fg-default)', marginBottom: 'var(--atmr-spacing-2x)' }}>Таблица пуста</Typography>
		<Typography variant="body-s" style={{ color: 'var(--atmr-light-fg-muted)', marginBottom: 'var(--atmr-spacing-6x)' }}>Причина, по которой в таблице нет данных</Typography>
		<div style="display: flex; gap: var(--atmr-spacing-3x); flex-direction: row">
			<Button label="Добавить данные" />
			<Button label="Загрузить данные" variant="ghost" />
		</div>
	</div>
{/snippet}

<div style="align-items: flex-start; width: 100%">
	<Typography variant="heading-h2" style={{ paddingBottom: 'var(--atmr-spacing-3x)' }}>Пустая таблица</Typography>

	<Typography variant="body-m" style={{ paddingBottom: 'var(--atmr-spacing-3x)' }}
		>Кастомный элемент передаётся в объект-параметр<Sp /><Typography as="span" variant="body-m" style={accent}>renders: EmptyTable</Typography></Typography
	>
	<TableGrid {columns} rows={[]} renders={{ emptyTable }} />
</div>
