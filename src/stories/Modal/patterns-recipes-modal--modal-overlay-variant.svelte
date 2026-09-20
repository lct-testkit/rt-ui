<script lang="ts">
	// Port of stories/Modal: ModalOverlayVariant (title "Patterns & Recipes/Modal"),
	// args { maxWidth: '420px', maxHeight: '320px', isCentered: true, scrollBehaviour: 'inside' }
	import './_modal-styles.css';
	import Button from '$lib/components/Button/Button/Button.svelte';
	import Modal from '$lib/components/Modal/Modal.svelte';

	let isModalOpen = $state(false);
	// `OverlayVariantType | undefined`; the third button passes 'none' (not a real variant) as in React
	let overlay = $state<any>(undefined);
	let visibleOverlay = $state(true);
	const centeredButtonRef = { current: null }; // React `useRef(null)` (ends up as `triggerref="[object Object]"` on the wrapper)

	const handleClose = () => {
		isModalOpen = false;
	};
	const handleOpen = (overlayView: string) => {
		if (overlayView) {
			visibleOverlay = true;
			overlay = overlayView;
		}
		isModalOpen = true;
	};
	const handleEscape = (e: KeyboardEvent) => {
		if (e.key === 'Escape') handleClose();
	};
</script>

<div class="atmr-modal__buttons">
	<Button onclick={() => handleOpen('primary')} size="l" label="primary" />
	<Button onclick={() => handleOpen('secondary')} size="l" label="secondary" />
	<Button onclick={() => handleOpen('none')} size="l" label="none" />
</div>

<Modal
	maxWidth="420px"
	maxHeight="320px"
	isCentered
	scrollBehaviour="inside"
	overlayVariant={overlay}
	overlay={visibleOverlay}
	triggerRef={centeredButtonRef}
	isOpened={isModalOpen}
	onClickOverlay={handleClose}
	onEsc={handleEscape}
	unmount
/>
