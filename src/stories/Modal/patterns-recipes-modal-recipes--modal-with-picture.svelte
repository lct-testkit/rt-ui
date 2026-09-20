<script lang="ts">
	// Port of stories/Modal: ModalWithPicture (title "Patterns & Recipes/Modal/Recipes")
	import './_modal-styles.css';
	import Box from '$lib/components/Box/Box.svelte';
	import Button from '$lib/components/Button/Button/Button.svelte';
	import CloseButton from '$lib/components/Button/CloseButton/CloseButton.svelte';
	import Modal from '$lib/components/Modal/Modal.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';

	let isModalOpen = $state(false);

	const handleClose = () => {
		isModalOpen = false;
	};
	const handleOpen = () => {
		isModalOpen = true;
	};
	const handleEscape = (e: KeyboardEvent) => {
		if (e.key === 'Escape') handleClose();
	};
</script>

<div class="atmr-modal__buttons">
	<Button onclick={() => handleOpen()} size="l" label="Вызвать модальное окно" />
</div>

<Modal
	class="modal-with-picture"
	maxWidth="564px"
	maxHeight="520px"
	isOpened={isModalOpen}
	onClickOverlay={handleClose}
	onEsc={handleEscape}
	isCentered
	unmount
>
	<!-- the remote CMS image is unreachable in the reference as well: a broken <img> with 0 height -->
	<img src="https://atomaro-cms-atomaro-docs.apps.okd.stage.digital.rt.ru/uploads/image_19edc7d10b.png" alt="Modal header" />
	<CloseButton onclick={handleClose} style="position: absolute; top: 36px; right: 36px; background: rgba(255, 255, 255, 1)" />
	<Box
		flex
		flexDirection="column"
		alignItems="start"
		justifyContent="start"
		mb="var(--atmr-spacing-8x)"
		gapY="var(--atmr-spacing-4x)"
		px="var(--atmr-spacing-8x)"
		pt="var(--atmr-spacing-8x)"
	>
		<Typography variant="heading-h2">Привет! Мы очень рады видеть вас в Лицее</Typography>
		<Typography variant="body-m" style="color: var(--atmr-fg-soft)">Узнайте, что есть на платформе, чтобы обучение стало увлекательным!</Typography>
	</Box>
	<Box flex alignItems="start" justifyContent="start" px="var(--atmr-spacing-8x)">
		<Button size="l" label="Привет" onclick={handleClose} />
	</Box>
</Modal>
