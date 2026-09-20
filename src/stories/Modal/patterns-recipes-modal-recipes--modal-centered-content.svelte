<script lang="ts">
	// Port of stories/Modal: ModalCenteredContent (title "Patterns & Recipes/Modal/Recipes")
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

<Modal maxWidth="480px" maxHeight="364px" isOpened={isModalOpen} onClickOverlay={handleClose} onEsc={handleEscape} isCentered unmount>
	<Box flex flexDirection="column" alignItems="start" justifyContent="start">
		<CloseButton onclick={handleClose} style="position: absolute; top: var(--atmr-spacing-8x); right: var(--atmr-spacing-8x)" />
	</Box>
	<Box flex flexDirection="column" alignItems="center" justifyContent="center" mt="36px">
		<Typography variant="display-l" strong style="padding: 0 var(--atmr-spacing-8x); margin-bottom: 12px">17%</Typography>
		<div class="progress-bar"></div>
	</Box>
	<Box flex flexDirection="column" alignItems="center" justifyContent="center" my="var(--atmr-spacing-8x)" gapY="var(--atmr-spacing-4x)">
		<Typography variant="heading-h2">Очистка кэша</Typography>
		<Typography variant="body-s" style="text-align: center; color: var(--atmr-fg-soft)">
			Идет процесс очистки кэша. Это может занять некоторое время. Подождите, пожалуйста.
		</Typography>
	</Box>
	<Box flex flexDirection="row" alignItems="center" justifyContent="start">
		<Button style="width: 100%" size="l" variant="secondary" colorScheme="neutral" label="Отмена" onclick={handleClose} />
	</Box>
</Modal>
