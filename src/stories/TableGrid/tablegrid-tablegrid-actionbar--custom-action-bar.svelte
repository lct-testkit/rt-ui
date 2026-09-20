<script lang="ts">
	// Story: TableGrid/TableGrid/ActionBar -> CustomActionBar (ActionBar.stories.tsx): own markup in the `actionBar` slot.
	import Checkbox from '$lib/components/Checkbox/Checkbox/Checkbox.svelte';
	import Download16 from '$lib/icons/16/action/Download16.svelte';
	import FunctionButton from '$lib/components/Button/FunctionButton/FunctionButton.svelte';
	import TableGrid from '$lib/components/TableGrid/TableGrid.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import Sp from '../_utils/Sp.svelte';
	import { PAGINATION_ROWS } from './_fixtures.js';

	const accent = { color: 'var(--atmr-accent-500)' };
	const pb = { paddingBottom: 'var(--atmr-spacing-3x)' };

	const tableRows = PAGINATION_ROWS.slice(0, 20);
	const visibleRowIds = tableRows.map((row) => String(row.id));
	let selected = $state<string[]>(['2']);

	const headerCheckbox = $derived.by(() => {
		const isAllVisibleSelected = visibleRowIds.length > 0 && visibleRowIds.every((id) => selected.includes(id));
		const isSomeVisibleSelected = visibleRowIds.some((id) => selected.includes(id));
		return { checked: isAllVisibleSelected, indeterminate: isSomeVisibleSelected && !isAllVisibleSelected };
	});
	const selectVisible = () => (selected = visibleRowIds);
	const clearSelection = () => (selected = []);
</script>

{#snippet headerCheck()}
	<Checkbox onChange={(v) => (v ? selectVisible() : clearSelection())} checked={headerCheckbox.checked} indeterminate={headerCheckbox.indeterminate} variant="primary" />
{/snippet}
{#snippet downloadIcon()}<Download16 />{/snippet}
<!-- React renders "Выбрано: " and the number as two text nodes -->
{#snippet selectedCount()}{selected.length}{/snippet}
{#snippet actionBar()}
	{#if selected.length > 0}
		<div class="atmr-tablegrid__actionbar">
			<div class="atmr-tablegrid__actionbar__selection">
				<div class="atmr-tablegrid__actionbar__checkbox" aria-hidden="true"></div>
				<span class="atmr-tablegrid__actionbar__count">Выбрано: {@render selectedCount()}</span>
			</div>
			<FunctionButton variant="primary" icon={downloadIcon} iconPosition="left" label="Скачать" />
			<FunctionButton variant="tertiary" label="Сбросить" onclick={() => clearSelection()} />
		</div>
	{/if}
{/snippet}

<div style="align-items: flex-start">
	<Typography variant="heading-h2" style={pb}>Кастомный Action Bar</Typography>

	<Typography variant="body-m" style={pb}
		>В слот<Sp /><Typography as="span" variant="body-m" style={accent}>actionBar</Typography><Sp />можно передать произвольную разметку. Хук<Sp /><Typography as="span" variant="body-m" style={accent}
			>useSelection</Typography
		><Sp />доступен только внутри таблицы.</Typography
	>

	<TableGrid
		style={{ width: '800px' }}
		containerStyle={{ maxHeight: '360px' }}
		headerSticky
		columns={[
			{ name: 'rasp', title: 'Распоряжение' },
			{ name: 'vls', title: 'ВЛС' },
			{ name: 'ur', title: 'УР' }
		]}
		rows={tableRows}
		rowConfig={{ selection: { defaultSelected: selected, onSelectionChange: (next) => (selected = next), renderFirstColumnHeader: headerCheck } }}
		renders={{ actionBar }}
	/>
</div>
