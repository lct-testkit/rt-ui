<script lang="ts">
	import FloatingActionButton from '$lib/components/FloatingActionButton/FloatingActionButton/FloatingActionButton.svelte';
	import Chat from '$lib/icons/24/communication/Chat.svelte';
	import OperatorSupport from '$lib/icons/24/communication/OperatorSupport.svelte';
	import HelpStroke from '$lib/icons/24/alert/HelpStroke.svelte';
	import Settings from '$lib/icons/24/action/Settings.svelte';

	const items = [
		{ iconSuffix: operatorSupport, tag: 'button', onclick: () => console.log('operator') },
		{ iconSuffix: helpStroke, tag: 'button', onclick: () => console.log('help') },
		{ iconSuffix: settings, tag: 'button', onclick: () => console.log('settings') }
	];
</script>

{#snippet operatorSupport()}<OperatorSupport size={20} />{/snippet}
{#snippet helpStroke()}<HelpStroke size={20} />{/snippet}
{#snippet settings()}<Settings size={20} />{/snippet}

<FloatingActionButton useInPortal={false} size="l" variant="secondary" label="Chat" {items}>
	{#snippet iconPrefix()}<Chat />{/snippet}
</FloatingActionButton>

<style>
	/* story-local CSS (stories/FloatingActionButton/styles.css) */
	:global(.atmr-floating-action-button) {
		z-index: 1500;
	}
</style>
