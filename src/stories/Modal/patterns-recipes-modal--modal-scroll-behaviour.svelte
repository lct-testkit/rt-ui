<script lang="ts">
	// Port of stories/Modal: ModalScrollBehaviour (title "Patterns & Recipes/Modal"), args { maxWidth: '420px' }
	import './_modal-styles.css';
	import Button from '$lib/components/Button/Button/Button.svelte';
	import Modal from '$lib/components/Modal/Modal.svelte';
	import { SCROLL_BEHAVIOR_MAP, type ScrollBehavior } from '$lib/components/Modal/constants.js';
	import Typography from '$lib/components/Typography/Typography.svelte';

	let isModalOpen = $state(false);
	let scroll = $state<ScrollBehavior>(SCROLL_BEHAVIOR_MAP.outside);
	let centered = $state(true);

	const handleClose = () => {
		isModalOpen = false;
	};
	const handleOpen = (scrollMode: ScrollBehavior) => {
		scroll = scrollMode;
		centered = scrollMode === SCROLL_BEHAVIOR_MAP.inside;
		isModalOpen = true;
	};
	const handleEscape = (e: KeyboardEvent) => {
		if (e.key === 'Escape') handleClose();
	};
</script>

<div class="atmr-modal__buttons">
	<Button onclick={() => handleOpen('inside')} size="l" label="inside" />
	<Button onclick={() => handleOpen('outside')} size="l" label="outside" />
</div>

<Modal maxWidth="420px" isOpened={isModalOpen} onClickOverlay={handleClose} onEsc={handleEscape} scrollBehaviour={scroll} isCentered={centered}>
	<div class="atmr-modal__inner">
		<Typography variant="body-m">
			Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Velit euismod in
			pellentesque massa. Vel fringilla est ullamcorper eget. Aliquet enim tortor at auctor urna nunc id cursus. Scelerisque viverra mauris in aliquam sem
			fringilla. Sed turpis tincidunt id aliquet risus feugiat in ante metus. Integer feugiat scelerisque varius morbi enim nunc. Duis tristique
			sollicitudin nibh sit amet commodo nulla. Id volutpat lacus laoreet non curabitur gravida arcu ac. Justo eget magna fermentum iaculis. Pulvinar
			sapien et ligula ullamcorper malesuada. In egestas erat imperdiet sed. Posuere sollicitudin aliquam ultrices sagittis.
		</Typography>
		<Typography variant="body-m">
			Ut tellus elementum sagittis vitae et. Vel quam elementum pulvinar etiam non quam lacus suspendisse. Suspendisse sed nisi lacus sed viverra tellus
			in hac habitasse. Nisi quis eleifend quam adipiscing. Imperdiet dui accumsan sit amet nulla facilisi morbi. Pellentesque eu tincidunt tortor aliquam
			nulla facilisi. Integer vitae justo eget magna fermentum iaculis eu non. Netus et malesuada fames ac turpis egestas integer. Sed viverra tellus in
			hac. Consectetur adipiscing elit duis tristique sollicitudin nibh. Interdum posuere lorem ipsum dolor sit. Dictum fusce ut placerat orci nulla
			pellentesque dignissim. Dui sapien eget mi proin sed libero enim. Elit pellentesque habitant morbi tristique senectus. Scelerisque varius morbi enim
			nunc faucibus a pellentesque sit. Non tellus orci ac auctor augue mauris. Commodo viverra maecenas accumsan lacus vel facilisis volutpat. Egestas
			purus viverra accumsan in nisl. Pulvinar sapien et ligula ullamcorper malesuada proin libero nunc consequat.
		</Typography>
		<Typography variant="body-m">
			Gravida rutrum quisque non tellus orci. Amet luctus venenatis lectus magna fringilla urna porttitor. Mattis aliquam faucibus purus in massa tempor.
			Sit amet consectetur adipiscing elit. Lectus quam id leo in vitae turpis. Ipsum consequat nisl vel pretium lectus quam. Mauris in aliquam sem
			fringilla. Aenean euismod elementum nisi quis eleifend quam adipiscing vitae proin. Nunc congue nisi vitae suscipit tellus mauris. Feugiat nisl
			pretium fusce id velit ut tortor. Vehicula ipsum a arcu cursus. Ornare aenean euismod elementum nisi quis eleifend. Et magnis dis parturient montes
			nascetur ridiculus mus. Sed id semper risus in hendrerit gravida rutrum quisque non. Posuere urna nec tincidunt praesent semper feugiat nibh sed
			pulvinar. Proin fermentum leo vel orci porta non pulvinar nequ
		</Typography>
	</div>
</Modal>
