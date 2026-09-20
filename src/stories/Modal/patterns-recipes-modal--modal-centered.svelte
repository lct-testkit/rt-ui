<script lang="ts">
	// Port of stories/Modal: ModalCentered (title "Patterns & Recipes/Modal")
	import './_modal-styles.css';
	import Button from '$lib/components/Button/Button/Button.svelte';
	import Modal from '$lib/components/Modal/Modal.svelte';

	let isModalOpen = $state(false);
	let isCentered = $state(false);
	// React `useRef(null)` passed as `triggerRef`: the Modal does not use it, it only ends up stringified on the wrapper (`triggerref="[object Object]"`)
	const centeredButtonRef = { current: null };

	const handleClose = () => {
		isModalOpen = false;
	};
	const handleOpen = (centered: boolean) => {
		isCentered = centered;
		isModalOpen = true;
	};
	const handleEscape = (e: KeyboardEvent) => {
		if (e.key === 'Escape') handleClose();
	};
</script>

<div class="atmr-modal__buttons">
	<Button onclick={() => handleOpen(true)} size="l" label="Modal по центру" />
	<Button onclick={() => handleOpen(false)} size="l" label="Modal с отступом сверху" />
</div>

<Modal
	maxWidth="420px"
	maxHeight="320px"
	scrollBehaviour="inside"
	overlayVariant="primary"
	triggerRef={centeredButtonRef}
	isOpened={isModalOpen}
	onClickOverlay={handleClose}
	onEsc={handleEscape}
	{isCentered}
	unmount
/>
