<script lang="ts">
	// Port of stories/Drawer: DrawerDimension "Main" (title "Patterns & Recipes/Drawer/Drawer Dimension"): two columns of buttons that open
	// the drawer at the right / top with `dimension` 0 (-> auto) or 300
	import './_drawer-styles.css';
	import Button from '$lib/components/Button/Button/Button.svelte';
	import Drawer from '$lib/components/Drawer/Drawer.svelte';
	import { DRAWER_POSITION, type DrawerPosition } from '$lib/components/Drawer/constants.js';
	import Typography from '$lib/components/Typography/Typography.svelte';

	let open = $state(false);
	let position = $state<DrawerPosition>(DRAWER_POSITION.right);
	let dimension = $state(0);

	const showDrawer = (pos: DrawerPosition, showDimension: number) => {
		dimension = showDimension;
		position = pos;
		open = true;
	};
	const handleClose = () => {
		open = false;
	};
</script>

<div class="buttons buttons--gap">
	<div class="buttons buttons--col">
		<Typography variant="body-m" style="width: 100%; text-align: center">dimension: none</Typography>
		<Button onclick={() => showDrawer(DRAWER_POSITION.right, 0)} label="Right" />
		<Button onclick={() => showDrawer(DRAWER_POSITION.top, 0)} label="Top" />
	</div>
	<div class="buttons buttons--col">
		<Typography variant="body-m" style="width: 100%; text-align: center">dimension: 300px</Typography>
		<Button onclick={() => showDrawer(DRAWER_POSITION.right, 300)} label="Right" />
		<Button onclick={() => showDrawer(DRAWER_POSITION.top, 300)} label="Top" />
	</div>
</div>
<Drawer {position} isOpened={open} onClickOverlay={handleClose} onClose={handleClose} class="drawer-example" dimension={dimension && 300}>
	<Typography variant="body-l">Пример, чтобы объяснить работу параметра dimension</Typography>
</Drawer>
