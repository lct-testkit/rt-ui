<script lang="ts">
	// Port of stories/Modal: ModalMaxHeigh (title "Patterns & Recipes/Modal"), args { isCentered: true }
	import './_modal-styles.css';
	import Button from '$lib/components/Button/Button/Button.svelte';
	import Modal from '$lib/components/Modal/Modal.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';

	let isModalOpen = $state(false);
	let maxHeight = $state('auto');
	const buttonRef = { current: null }; // React `useRef(null)` (ends up as `triggerref="[object Object]"` on the wrapper)

	const handleClose = () => {
		isModalOpen = false;
		maxHeight = 'auto';
	};
	const handleOpen = (height = 'auto') => {
		if (height) maxHeight = height;
		isModalOpen = true;
	};
	const handleEscape = (e: KeyboardEvent) => {
		if (e.key === 'Escape') handleClose();
	};
</script>

<div class="atmr-modal__buttons">
	<Button onclick={() => handleOpen()} size="l" label="none" />
	<Button onclick={() => handleOpen('300px')} size="l" label="300px" />
	<Button onclick={() => handleOpen('80%')} size="l" label="80%" />
</div>

<Modal isCentered triggerRef={buttonRef} isOpened={isModalOpen} onClickOverlay={handleClose} {maxHeight} onEsc={handleEscape} unmount>
	<div class="atmr-modal__inner">
		<Typography variant="body-m">Пример, показывающий работу параметра MaxHeight</Typography>
	</div>
</Modal>
