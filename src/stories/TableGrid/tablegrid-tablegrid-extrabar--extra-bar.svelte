<script lang="ts">
	// Story: TableGrid/TableGrid/ExtraBar (ExtraBar.stories.tsx)
	import Box from '$lib/components/Box/Box.svelte';
	import TableGrid from '$lib/components/TableGrid/TableGrid.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import { defaultRows } from './_fixtures.js';
</script>

{#snippet extraBar()}
	<Box px="atmr-spacing-3x" py="atmr-spacing-3x">
		<Typography variant="body-m" color="description">Может быть любой ваш контент</Typography>
	</Box>
{/snippet}

<div style="align-items: flex-start">
	<TableGrid
		columns={[
			{ name: 'rasp', title: 'Распоряжение' },
			{ name: 'vls', title: 'ВЛС' },
			{ name: 'ur', title: 'УР' }
		]}
		rows={defaultRows}
		renders={{ extraBar }}
	/>
</div>
