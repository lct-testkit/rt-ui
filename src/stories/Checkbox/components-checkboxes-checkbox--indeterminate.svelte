<script lang="ts">
	import Checkbox from '$lib/components/Checkbox/Checkbox/Checkbox.svelte';

	let isIndeterminate = $state(true);
</script>

<Checkbox label="Checkbox" indeterminate={isIndeterminate} onclick={() => (isIndeterminate = !isIndeterminate)} />
