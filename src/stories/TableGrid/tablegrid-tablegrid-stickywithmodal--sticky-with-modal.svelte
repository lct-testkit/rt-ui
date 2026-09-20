<script lang="ts">
	// Story: TableGrid/TableGrid/StickyWithModal -> StickyWithModal (StickyWithModal.stories.tsx): table with every sticky mode (header, footer,
	// first column, extraHeader, extraBar), selection, Pagination footer; the Modal must be drawn above the sticky parts.
	import './_sticky-modal-styles.css';
	import Box from '$lib/components/Box/Box.svelte';
	import Button from '$lib/components/Button/Button/Button.svelte';
	import CloseButton from '$lib/components/Button/CloseButton/CloseButton.svelte';
	import Checkbox from '$lib/components/Checkbox/Checkbox/Checkbox.svelte';
	import Input from '$lib/components/Input/Input.svelte';
	import Modal from '$lib/components/Modal/Modal.svelte';
	import Pagination from '$lib/components/Pagination/Pagination.svelte';
	import TableGrid from '$lib/components/TableGrid/TableGrid.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import AfterFonts from './_AfterFonts.svelte';
	import { PAGINATION_ROWS } from './_fixtures.js';

	const pb = { paddingBottom: 'var(--atmr-spacing-3x)' };
	const allRows = PAGINATION_ROWS;

	let isModalOpen = $state(false);
	let selected = $state<string[]>([]);
	let page = $state(1);
	let pageSize = $state(20);

	const firstPageIndex = $derived((page - 1) * pageSize);
	const pagedRows = $derived(allRows.slice(firstPageIndex, firstPageIndex + pageSize));
	const visibleRowIds = $derived(pagedRows.map((row) => String(row.id)));
	const totalPages = $derived(Math.ceil(allRows.length / pageSize));
	const headerCheckbox = $derived.by(() => {
		const isAllVisibleSelected = visibleRowIds.length > 0 && visibleRowIds.every((id) => selected.includes(id));
		const isSomeVisibleSelected = visibleRowIds.some((id) => selected.includes(id));
		return { checked: isAllVisibleSelected, indeterminate: isSomeVisibleSelected && !isAllVisibleSelected };
	});

	const closeModal = () => (isModalOpen = false);
	const selectVisible = () => (selected = [...new Set([...selected, ...visibleRowIds])]);
	const deselectVisible = () => (selected = selected.filter((id) => !visibleRowIds.includes(id)));
</script>

{#snippet headerCheck()}
	<Checkbox onChange={(v) => (v ? selectVisible() : deselectVisible())} checked={headerCheckbox.checked} indeterminate={headerCheckbox.indeterminate} variant="primary" />
{/snippet}
{#snippet extraHeaderContent()}
	<div style="display: flex; align-items: center; justify-content: center; flex-grow: 1">
		<div style="width: 420px; margin-left: 20px">
			<Input placeholder="Поиск" size="s" showLabel={false} />
		</div>
	</div>
{/snippet}
{#snippet extraBar()}
	<Box px="atmr-spacing-3x" py="atmr-spacing-2x">
		<Typography variant="body-m" color="description">Панель extraBar — фильтры, теги или любой контент</Typography>
	</Box>
{/snippet}
{#snippet footer()}
	<Pagination
		type="buttons"
		alignment="left"
		count={allRows.length}
		{pageSize}
		{page}
		onPageChange={(v) => (page = v)}
		onPageSizeChange={(v) => {
			pageSize = v;
			page = 1;
		}}
		total={{ enabled: true, label: `Строки ${firstPageIndex + 1}-${Math.min(firstPageIndex + pageSize, allRows.length)} из ${allRows.length}` }}
		pageSizeChanger={{ enabled: true, pageSizeOptions: [10, 20, 50] }}
		jumper={{ enabled: true, labelSuffix: `из ${totalPages}` }}
	/>
{/snippet}

<div style="align-items: flex-start">
	<Typography variant="heading-h2" style={pb}>Sticky + Modal</Typography>

	<Typography variant="body-m" style={pb}>Таблица со всеми sticky-режимами. Откройте модалку и прокрутите таблицу — sticky-элементы не должны перекрывать оверлей.</Typography>

	<div style="margin-bottom: var(--atmr-spacing-3x)">
		<Button label="Открыть модалку" size="l" onclick={() => (isModalOpen = true)} />
	</div>

	<AfterFonts>
		<TableGrid
			id="sticky-modal-table"
			size="m"
			style={{ width: '1100px' }}
			containerStyle={{ maxHeight: '480px' }}
			headerSticky
			footerSticky
			addonSticky
			extraHeaderSticky
			extraBarSticky
			columns={[
				{ name: 'rasp', title: 'Распоряжение' },
				{ name: 'vls', title: 'ВЛС' },
				{ name: 'ur', title: 'УР' },
				{ name: 'obm', title: 'OBM' }
			]}
			rows={pagedRows}
			rowConfig={{ selection: { defaultSelected: selected, onSelectionChange: (next) => (selected = next), renderFirstColumnHeader: headerCheck } }}
			renders={{ extraHeader: () => ({ title: 'Заголовок таблицы', content: extraHeaderContent }), extraBar, footer }}
		/>
	</AfterFonts>

	<Modal useInPortal isOpened={isModalOpen} isCentered maxWidth="480px" onClose={closeModal} onClickOverlay={closeModal} onEsc={closeModal}>
		<div class="atmr-modal__content">
			<div class="atmr-modal__header">
				<Typography variant="heading-h1" as="h1" elipsis>Модальное окно</Typography>
				<div class="atmr-modal__actions">
					<CloseButton onclick={closeModal} aria-label="Close" />
				</div>
			</div>
			<div class="atmr-modal__body">
				<Typography variant="body-m"
					>Оверлей и модалка должны быть поверх sticky header, extraBar и footer таблицы. Закройте окно и прокрутите таблицу — sticky-элементы остаются внутри контейнера.</Typography
				>
			</div>
			<div class="atmr-modal__footer">
				<Button label="Готово" size="l" onclick={closeModal} />
				<Button variant="outline" size="l" label="Отмена" onclick={closeModal} />
			</div>
		</div>
	</Modal>
</div>
