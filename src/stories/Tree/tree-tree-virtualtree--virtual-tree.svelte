<script lang="ts">
	// Story: Tree/Tree/VirtualTree (VirtualTree.stories.tsx; story decorator: a div with align-items: flex-start)
	import Tree from '$lib/components/Tree/Tree.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import Sp from '../_utils/Sp.svelte';
	import { createRows } from './_utils.js';

	const title =
		'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.';

	const term = { marginRight: 'var(--atmr-spacing-2x)', color: 'var(--atmr-accent-500)' };
</script>

<div style="align-items: flex-start">
	<Typography variant="heading-h2" style={{ paddingBottom: 'var(--atmr-spacing-3x)' }}>Виртуализация</Typography>
	<Typography variant="body-m" style={{ paddingBottom: 'var(--atmr-spacing-3x)' }}>Пропс virtualScroll принимает конфигурацию трех параметров: isEnable, overscanCount, listSize:</Typography>

	<Typography as="p" variant="body-m" style={{ paddingBottom: 'var(--atmr-spacing-3x)' }}
		><Typography as="span" variant="body-m" strong style={term}>isEnable</Typography
		>– включение виртуализации<Sp /></Typography
	>
	<Typography as="p" variant="body-m" style={{ paddingBottom: 'var(--atmr-spacing-3x)' }}
		><Typography as="span" variant="body-m" strong style={term}>overscanCount</Typography
		>– количество строк за пределами видимой зоны</Typography
	>
	<Typography as="p" variant="body-m" style={{ paddingBottom: 'var(--atmr-spacing-3x)' }}
		><Typography as="span" variant="body-m" strong style={term}>listSize</Typography
		>– выбор фиксированной и нефиксированной высоты строки</Typography
	>
	<div style="display: grid; grid-template-columns: 1fr 1fr; width: 100%">
		<div style="height: 400px">
			<Typography as="p" variant="body-m">listSize: fixed</Typography>
			<Tree data={createRows(100)} checkable virtualScroll={{ isEnable: true, listSize: 'fixed', overscanCount: 10 }} />
		</div>
		<div style="height: 400px">
			<Typography as="p" variant="body-m">listSize: variable</Typography>
			<Tree data={createRows(100, undefined, title)} checkable virtualScroll={{ isEnable: true, listSize: 'variable', overscanCount: 10 }} />
		</div>
	</div>
</div>
