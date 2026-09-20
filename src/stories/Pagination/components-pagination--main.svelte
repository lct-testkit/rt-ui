<script lang="ts">
	// Port of stories/Pagination Main (args: count 15, size m, variant primary, type buttons, alignment left)
	import './_styles.css';
	import Pagination from '$lib/components/Pagination/Pagination.svelte';
</script>

<Pagination count={15} size="m" variant="primary" type="buttons" alignment="left" />
