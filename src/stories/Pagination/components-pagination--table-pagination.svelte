<script lang="ts">
	// Port of stories/Pagination TablePagination (args: count 200, pageSize 10, pageSizeChanger 10/25/50, total, jumper); stateful `page` / `pageSize`
	import './_styles.css';
	import Pagination from '$lib/components/Pagination/Pagination.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';

	const count = 200;

	const getItems = (n: number) =>
		[...Array(n)].map((_, index) => {
			if (index + 1 === 69) return { value: `${index + 1} :*`, key: index };
			if (index + 1 === 228) return { value: `${index + 1} бойся`, key: index };
			if (index + 1 === 1337) return { value: `${index + 1} T3h l33t`, key: index };
			return { value: index + 1, key: index };
		});

	let page = $state(1);
	let pageSize = $state(10);

	const firstPageIndex = $derived((page - 1) * pageSize);
	const lastPageIndex = $derived(firstPageIndex + pageSize);
	const items = $derived(getItems(count).slice(firstPageIndex, lastPageIndex));

	// React calls `setPage(1)` while rendering when the current page has no items
	$effect.pre(() => {
		if (items.length === 0) {
			page = 1;
		}
	});

	const itemsLength = $derived(items.length);
	const totalLabel = $derived(
		`Строки ${firstPageIndex + 1}-${itemsLength < pageSize ? itemsLength + pageSize * (page - 1) : itemsLength * page} из ${count}`
	);
</script>

{#snippet num(v: string | number)}{v}{/snippet}

<div class="stories-items-container">
	{#each items as item (item.key)}
		<Typography variant="body-s">Предмет под номером {@render num(item.value)}</Typography>
	{/each}
</div>
<Pagination
	{count}
	size="m"
	variant="primary"
	type="buttons"
	alignment="left"
	pageSizeChanger={{ enabled: true, pageSizeOptions: [10, 25, 50] }}
	jumper={{ enabled: true }}
	{page}
	onPageChange={(v) => {
		page = v;
	}}
	{pageSize}
	onPageSizeChange={(v) => {
		pageSize = v;
	}}
	total={{ enabled: true, label: totalLabel }}
/>
