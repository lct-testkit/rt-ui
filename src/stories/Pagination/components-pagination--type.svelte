<script lang="ts">
	// Port of stories/Pagination Type (decorator: column flex, gap 10px, width 100%, marginLeft 100px; one Pagination per PAGINATION_TYPES)
	import './_styles.css';
	import Pagination from '$lib/components/Pagination/Pagination.svelte';
	import { PAGINATION_TYPES } from '$lib/components/Pagination/constants.js';
	import Typography from '$lib/components/Typography/Typography.svelte';
</script>

<div style="display: flex; flex-direction: column; gap: 10px; width: 100%; margin-left: 100px">
	{#each Object.values(PAGINATION_TYPES) as v}
		<div style="display: flex; flex-direction: column; gap: 4px">
			<Typography variant="body-m">{`type={${v}}`}</Typography>
			<Pagination count={100} size="m" variant="primary" alignment="left" type={v} />
		</div>
	{/each}
</div>
