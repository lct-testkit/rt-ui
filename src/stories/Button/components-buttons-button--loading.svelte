<script lang="ts">
	import Button from '$lib/components/Button/Button/Button.svelte';
	import Loader from '$lib/components/Loader/Loader.svelte';

	let isLoading = $state(false);

	async function handleClick() {
		isLoading = true;
		await new Promise((resolve) => setTimeout(resolve, 5000));
		isLoading = false;
	}
</script>

{#snippet loader()}<Loader size="2xs" />{/snippet}

<Button
	style="gap: var(--atmr-spacing-2x)"
	onclick={handleClick}
	disabled={isLoading}
	iconPrefix={isLoading ? loader : null}
	label={isLoading ? 'Loading...' : 'Click Me'}
/>
