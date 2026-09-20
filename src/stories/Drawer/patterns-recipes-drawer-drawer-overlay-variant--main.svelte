<script lang="ts">
	// Port of stories/Drawer: DrawerOverlayVariant "Main" (title "Patterns & Recipes/Drawer/Drawer Overlay Variant"), args { dimension: 320 }:
	// primary / secondary overlay, or no overlay ("none": the drawer then shows its own CloseButton)
	import './_drawer-styles.css';
	import Button from '$lib/components/Button/Button/Button.svelte';
	import CloseButton from '$lib/components/Button/CloseButton/CloseButton.svelte';
	import Drawer from '$lib/components/Drawer/Drawer.svelte';
	import type { OverlayVariant } from '$lib/components/Overlay/constants.js';

	let open = $state(false);
	let overlay = $state<OverlayVariant>('primary');
	let visibleOverlay = $state(true);

	const showDrawer = (overlayView: OverlayVariant | false) => {
		if (overlayView) {
			visibleOverlay = true;
			overlay = overlayView;
		} else {
			visibleOverlay = false;
		}
		open = true;
	};
	const handleClose = () => {
		open = false;
	};
</script>

<div class="buttons">
	<Button onclick={() => showDrawer('primary')} label="primary" />
	<Button onclick={() => showDrawer('secondary')} label="secondary" />
	<Button onclick={() => showDrawer(false)} label="none" />
</div>
<Drawer dimension={320} overlayVariant={overlay} overlay={visibleOverlay} isOpened={open} class="drawer-example" onClickOverlay={handleClose} onClose={handleClose}>
	{#if !visibleOverlay}
		<CloseButton onclick={handleClose} aria-label="Close" />
	{/if}
</Drawer>
