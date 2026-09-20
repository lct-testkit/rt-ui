<script lang="ts">
	// Story: TableGrid/TableGrid/ColumnMoveable (ColumnMoveable.stories.tsx)
	import TableGrid from '$lib/components/TableGrid/TableGrid.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import { defaultRows } from './_fixtures.js';
</script>

<div style="align-items: flex-start; width: 100%">
	<Typography variant="heading-h2" style={{ paddingBottom: 'var(--atmr-spacing-3x)' }}>Перемещение столбцов</Typography>

	<TableGrid
		columnConfig={{ move: true }}
		columns={[
			{ name: 'rasp', title: 'Распоряжение' },
			{ name: 'vls', title: 'ВЛС' },
			{ name: 'ur', title: 'УР' }
		]}
		rows={defaultRows}
	/>
</div>
