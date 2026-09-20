<script lang="ts">
	// Story: TableGrid/TableGrid/HiddenColumns (HiddenColumns.stories.tsx)
	import Box from '$lib/components/Box/Box.svelte';
	import CheckboxGroup from '$lib/components/Checkbox/CheckboxGroup/CheckboxGroup.svelte';
	import TableGrid from '$lib/components/TableGrid/TableGrid.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import { defaultRows } from './_fixtures.js';

	let visibleColumns = $state<string[]>(['rasp', 'vls', 'ur']);
	const columns = [
		{ name: 'rasp', title: 'Распоряжение' },
		{ name: 'vls', title: 'ВЛС' },
		{ name: 'ur', title: 'УР' }
	];
</script>

<div style="align-items: flex-start; width: 100%">
	<Typography variant="heading-h2" style={{ paddingBottom: 'var(--atmr-spacing-3x)' }}>Скрытие столбцов таблицы</Typography>

	<Box px="atmr-spacing-3x" py="atmr-spacing-3x">
		<CheckboxGroup
			defaultCheckedItems={visibleColumns}
			onChange={(value) => (visibleColumns = value)}
			items={[
				{ key: 'rasp', value: 'Распоряжение' },
				{ key: 'vls', value: 'ВЛС' },
				{ key: 'ur', value: 'УР' }
			]}
			parentBox
			size="s"
			title="Показывать колонки"
		/>
	</Box>

	<TableGrid columns={columns.filter((c) => visibleColumns.includes(c.name))} rows={defaultRows} />
</div>
