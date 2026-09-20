<script lang="ts">
	import FloatingActionButton from '$lib/components/FloatingActionButton/FloatingActionButton/FloatingActionButton.svelte';
	import Share from '$lib/icons/24/communication/Share.svelte';
	import Gosuslugi from '$lib/icons/24/logo/Gosuslugi.svelte';
	import Telegram from '$lib/icons/24/logo/Telegram.svelte';
	import Vkontakte from '$lib/icons/24/logo/Vkontakte.svelte';

	const items = [
		{ label: 'Госуслуги', iconPrefix: gosuslugi, onclick: () => console.log('Link click!') },
		{ label: 'Telegram', iconPrefix: telegram, onclick: () => console.log('Link click!') },
		{ label: 'ВКонтакте', iconPrefix: vkontakte, href: '/?path=/story/documentation-changelog--page', target: '__blank' }
	];
</script>

{#snippet gosuslugi()}<Gosuslugi size={20} />{/snippet}
{#snippet telegram()}<Telegram size={20} />{/snippet}
{#snippet vkontakte()}<Vkontakte size={20} />{/snippet}

<FloatingActionButton
	useInPortal={false}
	size="l"
	variant="primary"
	overlayVariant="primary"
	{items}
	onClickOverlay={() => console.log('Overlay clicked!')}
>
	{#snippet iconPrefix()}<Share />{/snippet}
</FloatingActionButton>

<style>
	/* story-local CSS (stories/FloatingActionButton/styles.css) */
	:global(.atmr-floating-action-button) {
		z-index: 1500;
	}
</style>
