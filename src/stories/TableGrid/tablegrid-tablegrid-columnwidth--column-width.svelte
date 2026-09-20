<script lang="ts">
	// Story: TableGrid/TableGrid/ColumnWidth (ColumnWidth.stories.tsx)
	import Input from '$lib/components/Input/Input.svelte';
	import TableGrid from '$lib/components/TableGrid/TableGrid.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import { defaultRows } from './_fixtures.js';

	let widthRasp = $state<number | string>(120);
	let widthVls = $state<number | string>(150);
	let widthUr = $state<number | string>(120);

	const handleChangeInputs = (e: { target: { value: string } }, col: 'rasp' | 'vls' | 'ur') => {
		const value = e.target.value.replace(/[^0-9]/g, '');
		if (col === 'rasp') widthRasp = value;
		else if (col === 'vls') widthVls = value;
		else widthUr = value;
	};
</script>

<div style="align-items: flex-start; width: 100%">
	<Typography variant="heading-h2" style={{ paddingBottom: 'var(--atmr-spacing-3x)' }}>Ширина столбца</Typography>

	<div style="display: flex; margin-bottom: 20px; gap: var(--atmr-spacing-4x); max-width: 400px">
		<Input size="s" label="Распоряжение" value={widthRasp.toString()} onChange={(e) => handleChangeInputs(e, 'rasp')} />
		<Input size="s" label="ВЛС" value={widthVls.toString()} onChange={(e) => handleChangeInputs(e, 'vls')} />
		<Input size="s" label="УР" value={widthUr.toString()} onChange={(e) => handleChangeInputs(e, 'ur')} />
	</div>

	<TableGrid
		columns={[
			{ name: 'rasp', title: 'Распоряжение', size: { width: widthRasp } },
			{ name: 'vls', title: 'ВЛС', size: { width: widthVls } },
			{ name: 'ur', title: 'УР', size: { width: widthUr } }
		]}
		rows={defaultRows}
	/>
</div>
