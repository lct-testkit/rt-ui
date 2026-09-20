<script lang="ts">
	import Switch from '$lib/components/Switch/Switch.svelte';

	let checked = $state(false);
</script>

<Switch label="Label" {checked} onChange={(v) => (checked = v)} />
