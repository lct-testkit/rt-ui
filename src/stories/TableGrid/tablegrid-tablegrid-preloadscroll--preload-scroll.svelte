<script lang="ts">
	// Story: TableGrid/TableGrid/PreloadScroll (PreloadScroll.stories.tsx): `infiniteScroll.action` renders a "load more" button
	import Box from '$lib/components/Box/Box.svelte';
	import Button from '$lib/components/Button/Button/Button.svelte';
	import Synchronization from '$lib/icons/24/action/Synchronization.svelte';
	import TableGrid from '$lib/components/TableGrid/TableGrid.svelte';
	import { makeDataRow } from './_fixtures.js';

	let rows = $state.raw(makeDataRow(20));
	let isLoading = $state(false);

	const columns = [
		{ name: 'rasp', title: 'Распоряжение', unit: 'km', size: { width: '300px' } },
		{ name: 'vls', title: 'ВЛС', unit: 'km', size: { width: '200px' } },
		{ name: 'ur', title: 'УР', size: { width: '200px' } },
		{ name: 'ps', title: 'Оконечные ПС Оконечные ПС Оконечные ПС', size: { width: '200px' } },
		{ name: 'tech', title: 'Тех примечание', size: { width: '200px' } },
		{ name: 'view', title: 'Вид работ', unit: '$', size: { width: '200px' } },
		{ name: 'viis', title: 'ВИ/ИС', size: { width: '200px' } },
		{ name: 'sro', title: 'СроОтклПлан', size: { width: '200px' } },
		{ name: 'status', title: 'Статус', size: { width: '200px' } }
	];

	const onLoadMore = () => {
		isLoading = true;
		setTimeout(() => {
			rows = makeDataRow(rows.length + 40);
			isLoading = false;
		}, 2000);
	};
</script>

{#snippet action(onClick: () => void)}
	<Box {...{ width: '100%' }} flex justifyContent="center" px="atmr-spacing-1x" py="atmr-spacing-1x">
		<Button variant="ghost" size="m" onclick={onClick}>
			{#snippet label()}
				<Box flex alignItems="center">
					<Synchronization />
					<Box pt="atmr-spacing-0-5x" pl="atmr-spacing-1-5x">Загрузить ещё</Box>
				</Box>
			{/snippet}
		</Button>
	</Box>
{/snippet}

<div style="align-items: flex-start">
	<div style="height: 495px">
		<TableGrid headerSticky {columns} {rows} infiniteScroll={{ loadMore: true, loading: isLoading, action, onLoadMore }} />
	</div>
</div>
