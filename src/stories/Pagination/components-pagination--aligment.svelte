<script lang="ts">
	// Port of stories/Pagination Aligment (decorator: column flex, gap 10px, width 100%; one Pagination per PAGINATION_ALIGNMENT)
	import './_styles.css';
	import Pagination from '$lib/components/Pagination/Pagination.svelte';
	import { PAGINATION_ALIGNMENT } from '$lib/components/Pagination/constants.js';
</script>

<div style="display: flex; flex-direction: column; gap: 10px; width: 100%">
	{#each Object.values(PAGINATION_ALIGNMENT) as v}
		<Pagination
			count={3}
			pageSize={1}
			pageSizeChanger={{ enabled: true, pageSizeOptions: [1] }}
			total={{ enabled: true }}
			jumper={{ enabled: true }}
			size="m"
			variant="primary"
			type="buttons"
			alignment={v}
		/>
	{/each}
</div>
