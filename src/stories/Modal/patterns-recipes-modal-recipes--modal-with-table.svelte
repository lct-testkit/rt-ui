<script lang="ts">
	// Port of stories/Modal: ModalWithTable (title "Patterns & Recipes/Modal/Recipes")
	import './_modal-styles.css';
	import Badge from '$lib/components/Badge/Badge.svelte';
	import Box from '$lib/components/Box/Box.svelte';
	import Button from '$lib/components/Button/Button/Button.svelte';
	import CloseButton from '$lib/components/Button/CloseButton/CloseButton.svelte';
	import FunctionButton from '$lib/components/Button/FunctionButton/FunctionButton.svelte';
	import Checkbox from '$lib/components/Checkbox/Checkbox/Checkbox.svelte';
	import Modal from '$lib/components/Modal/Modal.svelte';
	import TableGrid from '$lib/components/TableGrid/TableGrid.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import AddSmall from '$lib/icons/24/action/AddSmall.svelte';

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

	// React rows hold a <Badge> element in `status` (a snippet here).
	// NOTE: like in the React story the last two rows have the same `id: 5` (React only warns about duplicate keys, TableGrid renders both).
	const ROWS = [
		{ id: 1, status: completed, name: 'Никольский Д. Н.', tabelNum: '0004', manager: 'Константинопальский К.А.' },
		{ id: 2, status: inProgress, name: 'Соловьёва Е. И.', tabelNum: '0005', manager: 'Иванов С.И.' },
		{ id: 3, status: inProgress, name: 'Спиридонов Ф. М.', tabelNum: '0012', manager: 'Карпов Г. Ф.' },
		{ id: 4, status: inProgress, name: 'Чернышев С. M.', tabelNum: '0006', manager: 'Колесникова С. З.' },
		{ id: 5, status: onHold, name: 'Кудрявцев И. Р.', tabelNum: '0003', manager: 'Архипов А. Д.' },
		{ id: 5, status: onHold, name: 'Лебедева А. Т.', tabelNum: '0021', manager: 'Смирнова В. А.' }
	];
	const COLUMNS = [
		{ key: 'status', name: 'status', title: 'Статус', size: { width: '200px' } },
		{ key: 'name', name: 'name', title: 'ФИО', size: { width: '200px' } },
		{ key: 'tabelNum', name: 'tabelNum', title: 'Табельный номер', size: { width: '200px' } },
		{ key: 'manager', name: 'manager', title: 'Руководитель', size: { width: '200px' } }
	];
</script>

{#snippet completed()}<Badge label="Completed" size="s" variant="secondary" colorScheme="success" />{/snippet}
{#snippet inProgress()}<Badge label="In progress" size="s" variant="secondary" colorScheme="info" />{/snippet}
{#snippet onHold()}<Badge label="On hold" size="s" variant="secondary" colorScheme="neutral" />{/snippet}

<div class="atmr-modal__buttons">
	<Button onclick={() => handleOpen()} size="l" label="Вызвать модальное окно" />
</div>

<Modal maxWidth="75%" maxHeight="584px" isOpened={isModalOpen} onClickOverlay={handleClose} onEsc={handleEscape} class="modal-stories-table" isCentered unmount>
	<Box flex flexDirection="column" alignItems="start" justifyContent="start" mb="var(--atmr-spacing-8x)">
		<Box flex flexDirection="column" alignItems="start" justifyContent="start" gapY="var(--atmr-spacing-3x)">
			<Typography variant="heading-h1">Создание запроса данных</Typography>
			<Typography variant="body-s" style="color: var(--atmr-fg-soft)">Линейным руководителям будет отправлен запрос данных по выбранным сотрудникам</Typography>
		</Box>
		<CloseButton onclick={handleClose} style="position: absolute; top: var(--atmr-spacing-8x); right: var(--atmr-spacing-8x)" />
	</Box>
	<Box flex flexDirection="column" alignItems="start" justifyContent="start" gapY="var(--atmr-spacing-4x)" py="var(--atmr-spacing-3x)">
		<TableGrid columns={COLUMNS} rows={ROWS} />
		<FunctionButton label="Новая строка" iconPosition="left">
			{#snippet icon()}<AddSmall />{/snippet}
		</FunctionButton>
	</Box>
	<Box flex flexDirection="row" alignItems="center" justifyContent="between" pt="var(--atmr-spacing-8x)" style="flex-wrap: wrap">
		<Box flex flexDirection="row" alignItems="center" justifyContent="start">
			<Button style="width: 190px; margin-right: var(--atmr-spacing-3x); flex-shrink: 0" size="l" label="Отправить запрос" onclick={handleClose} />
			<Button style="flex-shrink: 0" size="l" variant="outline" colorScheme="neutral" label="Отмена" onclick={handleClose} />
		</Box>
		<Checkbox label="Сохранить запрос" style="flex-shrink: 0" />
	</Box>
</Modal>
