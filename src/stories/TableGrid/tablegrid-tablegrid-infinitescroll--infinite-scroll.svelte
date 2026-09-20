<script lang="ts">
	// Story: TableGrid/TableGrid/InfiniteScroll (InfiniteScroll.stories.tsx)
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

<div style="align-items: flex-start">
	<div style="height: 495px">
		<TableGrid headerSticky {columns} {rows} infiniteScroll={{ loadMore: true, loading: isLoading, onLoadMore }} />
	</div>
</div>
