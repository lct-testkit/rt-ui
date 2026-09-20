<script lang="ts">
	// Port of stories/Modal: ModalWithForm (title "Patterns & Recipes/Modal/Recipes")
	import './_modal-styles.css';
	import Badge from '$lib/components/Badge/Badge.svelte';
	import Box from '$lib/components/Box/Box.svelte';
	import Button from '$lib/components/Button/Button/Button.svelte';
	import CloseButton from '$lib/components/Button/CloseButton/CloseButton.svelte';
	import Modal from '$lib/components/Modal/Modal.svelte';
	import Multiselect from '$lib/components/Multiselect/Multiselect.svelte';
	import Select from '$lib/components/Select/Select.svelte';
	import TextArea from '$lib/components/TextArea/TextArea.svelte';
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

	const RESPONSIBLE_OPTIONS = [
		{ key: 'r1', value: 'Никольский Даниил' },
		{ key: 'r2', value: 'Сергеев Сергей' },
		{ key: 'r3', value: 'Бодров Сергей' }
	];
	const VIEWERS_OPTIONS = [
		{ key: '1', value: 'Федотов В.М.' },
		{ key: '2', value: 'Малинина Е.М.' },
		{ key: '3', value: 'Евтушенко А.В.' },
		{ key: '4', value: 'Карачаев С.С.' }
	];
</script>

<div class="atmr-modal__buttons">
	<Button onclick={() => handleOpen()} size="l" label="Вызвать модальное окно" />
</div>

<Modal maxWidth="560px" maxHeight="468px" isOpened={isModalOpen} onClickOverlay={handleClose} onEsc={handleEscape} isCentered unmount>
	<Box flex flexDirection="column" alignItems="start" justifyContent="start" mb="var(--atmr-spacing-8x)">
		<Box flex flexDirection="column" alignItems="start" justifyContent="start" gapY="var(--atmr-spacing-3x)">
			<Box flex flexDirection="row" alignItems="center" justifyContent="start" gapX="var(--atmr-spacing-3x)">
				<Typography variant="heading-h1">Согласование заявки</Typography>
				<Badge label="№7452" size="s" variant="secondary" />
			</Box>
			<Typography variant="body-s" style="color: var(--atmr-fg-soft)">Укажите права и доступы к заявке перед согласованием</Typography>
		</Box>
		<CloseButton onclick={handleClose} style="position: absolute; top: var(--atmr-spacing-8x); right: var(--atmr-spacing-8x)" />
	</Box>
	<Box flex flexDirection="column" alignItems="center" justifyContent="start" gapY="var(--atmr-spacing-4x)">
		<Select label="Ответственный" items={RESPONSIBLE_OPTIONS} autocomplete={{ enabled: false }} />
		<Multiselect size="l" label="Кто видит заявку" items={VIEWERS_OPTIONS} />
		<TextArea size="l" showLabel={false} placeholder="Комментарий" style="width: 100%" />
	</Box>
	<Box flex flexDirection="row" alignItems="start" justifyContent="start" mt="var(--atmr-spacing-8x)">
		<Button style="margin-right: var(--atmr-spacing-3x)" size="l" label="Согласовать" onclick={handleClose} />
		<Button size="l" variant="secondary" colorScheme="neutral" label="Отмена" onclick={handleClose} />
	</Box>
</Modal>
