<script lang="ts">
	// Story: TableGrid/TableGrid/ColumnResize (ColumnResize.stories.tsx)
	import TableGrid from '$lib/components/TableGrid/TableGrid.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import { defaultRows } from './_fixtures.js';
</script>

<div style="align-items: flex-start; width: 100%">
	<Typography variant="heading-h2" style={{ paddingBottom: 'var(--atmr-spacing-3x)' }}>Изменение ширины столбцов</Typography>

	<div style="align-items: flex-start; width: 800px; border: 1px dashed grey">
		<TableGrid
			columnConfig={{ resize: true }}
			columns={[
				{ name: 'rasp', title: 'Распоряжение', size: { min: 100, max: 400 } },
				{ name: 'vls', title: 'ВЛС', size: { min: 100, max: 400 } },
				{ name: 'ur', title: 'УР', size: { min: 100, max: 400 } }
			]}
			rows={defaultRows}
		/>
	</div>
</div>
