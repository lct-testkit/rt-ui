<script lang="ts">
	// Port of stories/Pagination Size (decorator: column flex, gap 10px, width 100%; one Pagination per PAGINATION_SIZES)
	import './_styles.css';
	import Pagination from '$lib/components/Pagination/Pagination.svelte';
	import { PAGINATION_SIZES } from '$lib/components/Pagination/constants.js';
</script>

<div style="display: flex; flex-direction: column; gap: 10px; width: 100%">
	{#each Object.values(PAGINATION_SIZES) as v}
		<Pagination
			count={200}
			pageSize={10}
			pageSizeChanger={{ enabled: true, pageSizeOptions: [10, 25, 50] }}
			total={{ enabled: true }}
			jumper={{ enabled: true }}
			variant="primary"
			type="buttons"
			alignment="left"
			size={v}
		/>
	{/each}
</div>
