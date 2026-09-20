<script lang="ts">
	// Story: TableGrid/TableGrid/HeaderBar (HeaderBar.stories.tsx), initial arg `headerTitle: 'Заголовок таблицы'`
	import Input from '$lib/components/Input/Input.svelte';
	import TableGrid from '$lib/components/TableGrid/TableGrid.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import Sp from '../_utils/Sp.svelte';
	import { defaultRows } from './_fixtures.js';

	const args = { headerTitle: 'Заголовок таблицы' };
	const accent = { color: 'var(--atmr-accent-500)' };
</script>

{#snippet headerContent()}
	<div style="display: flex; align-items: center; justify-content: center; flex-grow: 1">
		<div style="width: 530px; margin-left: 20px">
			<Input placeholder="Поиск" size="s" showLabel={false} />
		</div>
	</div>
{/snippet}

<div style="align-items: flex-start">
	<Typography variant="heading-h2" style={{ paddingBottom: 'var(--atmr-spacing-3x)' }}>Шапка таблицы</Typography>

	<Typography variant="body-m" style={{ paddingBottom: 'var(--atmr-spacing-3x)' }}
		>Включается параметром<Sp /><Typography as="span" variant="body-m" style={accent}>extraHeader</Typography><Sp />в объект-параметре<Sp /><Typography as="span" variant="body-m" style={accent}>renders</Typography><Sp />, принимает заголовок таблицы -<Sp /><Typography as="span" variant="body-m" style={accent}>title</Typography><Sp />и контейнер с любым содержимым -<Sp /><Typography as="span" variant="body-m" style={accent}>content</Typography></Typography
	>

	<TableGrid
		columns={[
			{ name: 'rasp', title: 'Распоряжение' },
			{ name: 'vls', title: 'ВЛС' },
			{ name: 'ur', title: 'УР' }
		]}
		rows={defaultRows}
		renders={{ extraHeader: () => ({ title: args.headerTitle, content: headerContent }) }}
	/>
</div>
