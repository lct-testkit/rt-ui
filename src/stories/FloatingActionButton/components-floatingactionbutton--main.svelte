<script lang="ts">
	import FloatingActionButton from '$lib/components/FloatingActionButton/FloatingActionButton/FloatingActionButton.svelte';
	import Chat from '$lib/icons/24/communication/Chat.svelte';
</script>

<FloatingActionButton useInPortal={false} size="l" variant="primary" label="Чат" onclick={() => console.log('Some action!')}>
	{#snippet iconPrefix()}<Chat />{/snippet}
</FloatingActionButton>

<style>
	/* story-local CSS (stories/FloatingActionButton/styles.css) */
	:global(.atmr-floating-action-button) {
		z-index: 1500;
	}
</style>
