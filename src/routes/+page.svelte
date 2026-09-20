<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	onMount(() => goto('/gallery', { replaceState: true }));
</script>

<p>→ <a href="/gallery">/gallery</a></p>
