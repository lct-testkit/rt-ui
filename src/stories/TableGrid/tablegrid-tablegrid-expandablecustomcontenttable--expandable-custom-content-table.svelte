<script lang="ts">
	// Story: TableGrid/TableGrid/ExpandableCustomContentTable (ExpandableCustomContentTable.stories.tsx)
	import TableGrid from '$lib/components/TableGrid/TableGrid.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import Sp from '../_utils/Sp.svelte';
	import { DEFAULT_COLUMNS, ROWS } from './_fixtures.js';

	const accent = { color: 'var(--atmr-accent-500)' };
	const pb = { paddingBottom: 'var(--atmr-spacing-3x)' };
</script>

{#snippet expanded()}
	<Typography variant="body-m" style={{ padding: 'var(--atmr-spacing-2x)' }}>Я могу быть чем угодно, но самоопределяюсь как текст в раскрытой строке таблицы</Typography>
{/snippet}

<div style="align-items: flex-start">
	<Typography variant="body-m" style={pb}
		>Для того, чтобы строка имела возможность раскрываться, мы добавляем условие в функцию<Sp /><Typography as="span" variant="body-m" style={accent}>hasExpanded</Typography>.</Typography
	>
	<Typography variant="body-m" style={pb}
		>В данном примере нет разницы на что мы делаем проверку, потому что мы возвращаем в<Sp /><Typography as="span" variant="body-m" style={accent}>render<Sp /></Typography>кастомный
		контент, который будет одинаков для всех строчек, которые подходят под условие</Typography
	>
	<TableGrid columns={DEFAULT_COLUMNS} rows={ROWS} rowConfig={{ expand: { expandedKeys: ['1'], hasExpanded: (row) => row.children.length > 0, render: expanded } }} />
</div>
