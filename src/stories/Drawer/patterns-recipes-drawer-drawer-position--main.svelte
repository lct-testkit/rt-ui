<script lang="ts">
	// Port of stories/Drawer: DrawerPosition "Main" (title "Patterns & Recipes/Drawer/Drawer Position"), args { dimension: 320 }
	import './_drawer-styles.css';
	import Button from '$lib/components/Button/Button/Button.svelte';
	import Drawer from '$lib/components/Drawer/Drawer.svelte';
	import { DRAWER_POSITION, type DrawerPosition } from '$lib/components/Drawer/constants.js';

	let open = $state(false);
	let position = $state<DrawerPosition>(DRAWER_POSITION.right);

	const showDrawer = (pos: DrawerPosition) => {
		position = pos;
		open = true;
	};
	const handleClose = () => {
		open = false;
	};
</script>

<div class="buttons">
	<Button onclick={() => showDrawer(DRAWER_POSITION.right)} label="Right" />
	<Button onclick={() => showDrawer(DRAWER_POSITION.left)} label="Left" />
	<Button onclick={() => showDrawer(DRAWER_POSITION.top)} label="Top" />
	<Button onclick={() => showDrawer(DRAWER_POSITION.bottom)} label="Bottom" />
</div>
<Drawer dimension={320} {position} isOpened={open} class="drawer-example" onClickOverlay={handleClose} onClose={handleClose} />
