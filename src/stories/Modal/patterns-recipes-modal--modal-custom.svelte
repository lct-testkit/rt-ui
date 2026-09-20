<script lang="ts">
	// Port of stories/Modal: ModalCustom (title "Patterns & Recipes/Modal"), args { maxWidth: '420px', isCentered: true,
	// scrollBehaviour: 'inside', overlayVariant: 'primary' } (+ storybook actions for onEsc / onClickOverlay / onClose)
	import './_modal-styles.css';
	import Button from '$lib/components/Button/Button/Button.svelte';
	import CloseButton from '$lib/components/Button/CloseButton/CloseButton.svelte';
	import Input from '$lib/components/Input/Input.svelte';
	import Modal from '$lib/components/Modal/Modal.svelte';
	import Select from '$lib/components/Select/Select.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import { OPTIONS_LONG } from '../DropdownMenu/_options.js';

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

{#snippet closeIconNode()}
	<CloseButton onclick={handleClose} aria-label="Close" />
{/snippet}

{#snippet renderHeader()}
	<div class="atmr-modal__header">
		<Typography variant="heading-h1" as="h1" elipsis>Заголовок</Typography>
		<div class="atmr-modal__actions">{@render closeIconNode()}</div>
	</div>
{/snippet}

{#snippet renderFooter()}
	<div class="atmr-modal__footer">
		<Button label="Действие" size="l" />
		<Button variant="outline" size="l" onclick={handleClose} label="Отмена" />
	</div>
{/snippet}

<div class="story_item" style="margin-bottom: 250px">
	<Typography variant="heading-h1" style="margin-bottom: 25px">Кастомная стилизация и контент в Popup c кнопкой закрытия</Typography>
	<Button onclick={handleOpen} size="l" label="Показать Modal" data-testid="click" />
</div>

<Modal
	maxWidth="420px"
	isCentered
	scrollBehaviour="inside"
	overlayVariant="primary"
	isOpened={isModalOpen}
	onClickOverlay={handleClose}
	onEsc={handleEscape}
>
	<div class="atmr-modal__content">
		{@render renderHeader()}
		<div class="atmr-modal__body">
			<Typography variant="body-m" style="margin-bottom: 16px">
				Компонент Modal реализован как пустой контейнер, который вы можете стилизовать так, как вам нужно и наполнить его любым контентом.
			</Typography>
			<Select items={OPTIONS_LONG} label="Label" />
			<Input size="l" style="margin-top: 20px" />
		</div>
		{@render renderFooter()}
	</div>
</Modal>
