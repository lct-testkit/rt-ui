<script lang="ts">
	// Port of stories/Modal: ModalOverlayClickClose (title "Patterns & Recipes/Modal"), args { maxHeight: '320px', maxWidth: '420px', isCentered: true }
	import './_modal-styles.css';
	import Button from '$lib/components/Button/Button/Button.svelte';
	import CloseButton from '$lib/components/Button/CloseButton/CloseButton.svelte';
	import Modal from '$lib/components/Modal/Modal.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';

	let isModalOpen = $state(false);
	let isModalOpenSecond = $state(false);
	const centeredButtonRef = { current: null }; // React `useRef(null)` (ends up as `triggerref="[object Object]"` on the wrapper)

	const handleClose = () => {
		isModalOpen = false;
		isModalOpenSecond = false;
	};
	const handleOpen = () => {
		isModalOpen = true;
	};
	const handleOpenSecond = () => {
		isModalOpenSecond = true;
	};
	const handleEscape = (e: KeyboardEvent) => {
		if (e.key === 'Escape') handleClose();
	};
</script>

{#snippet closeIconNode()}
	<CloseButton onclick={handleClose} aria-label="Close" />
{/snippet}

<div class="story_item">
	<Typography variant="heading-h2" style="margin-bottom: 25px">Закрытие окна при клике на слое Overlay</Typography>
</div>
<div class="atmr-modal__buttons">
	<Button onclick={() => handleOpen()} size="l" label="С закрытием" />
	<Button onclick={() => handleOpenSecond()} size="l" label="Без закрытия" />
</div>

<Modal
	maxHeight="320px"
	maxWidth="420px"
	isCentered
	triggerRef={centeredButtonRef}
	isOpened={isModalOpen}
	onClickOverlay={handleClose}
	onEsc={handleEscape}
	unmount
>
	<div class="atmr-modal__actions">{@render closeIconNode()}</div>
</Modal>

<Modal maxHeight="320px" maxWidth="420px" isCentered triggerRef={centeredButtonRef} isOpened={isModalOpenSecond} onEsc={handleEscape} unmount>
	<div class="atmr-modal__actions">{@render closeIconNode()}</div>
</Modal>
