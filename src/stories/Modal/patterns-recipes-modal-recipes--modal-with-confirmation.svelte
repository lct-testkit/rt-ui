<script lang="ts">
	// Port of stories/Modal: ModalWithConfirmation (title "Patterns & Recipes/Modal/Recipes")
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

<Modal maxWidth="560px" maxHeight="228px" isOpened={isModalOpen} onClickOverlay={handleClose} onEsc={handleEscape} isCentered unmount>
	<Box flex flexDirection="column" alignItems="start" justifyContent="start" mb="var(--atmr-spacing-8x)">
		<Box flex flexDirection="column" alignItems="start" justifyContent="start" gapY="var(--atmr-spacing-3x)">
			<Typography variant="heading-h2">Вы уверены что хотите отключить уведомления?</Typography>
			<Typography variant="body-m" style="color: var(--atmr-fg-soft)">Вы не сможете узнать статус загрузки документов в ЛК</Typography>
		</Box>
		<CloseButton onclick={handleClose} style="position: absolute; top: var(--atmr-spacing-8x); right: var(--atmr-spacing-8x)" />
	</Box>
	<Box flex flexDirection="row" alignItems="center" justifyContent="start">
		<Button style="width: 100%; margin-right: var(--atmr-spacing-3x)" size="l" label="Отключить" onclick={handleClose} />
		<Button style="width: 100%" size="l" variant="secondary" colorScheme="neutral" label="Отмена" onclick={handleClose} />
	</Box>
</Modal>
