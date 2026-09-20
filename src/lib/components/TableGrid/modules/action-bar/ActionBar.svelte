<script lang="ts">
	// Port of TableGrid/modules/action-bar/components/ActionBar.tsx: a ready-made panel for `renders.actionBar`
	// ("N выбрано" + custom children + delete / cancel buttons). It reads the selection of the surrounding TableGrid
	// (`useSelection()`), so it works only inside the table (the `actionBar` slot is rendered inside it) and renders nothing while no row is
	// selected. `onDelete(selectedKeys)` / `onCancel(selectedKeys)` are called first, then the selection is cleared.
	//
	//   {#snippet actionBar()}<ActionBar onDelete={(keys) => remove(keys)} />{/snippet}
	//   <TableGrid ... renders={{ actionBar }} rowConfig={{ selection: { defaultSelected: [] } }} />
	import clsx from 'clsx';
	import type { Snippet } from 'svelte';
	import CloseLarge from '../../../../icons/24/navigation/CloseLarge.svelte';
	import Trash from '../../../../icons/24/action/Trash.svelte';
	import Slot from '../../../../internal/Slot.svelte';
	import type { Content } from '../../../../internal/types.js';
	import FunctionButton from '../../../Button/FunctionButton/FunctionButton.svelte';
	import Checkbox from '../../../Checkbox/Checkbox/Checkbox.svelte';
	import { useSelection } from '../selection/selection.svelte.js';

	interface Props {
		/** Подпись с количеством выбранных строк (по умолчанию "N выбрано") */
		selectedLabel?: (count: number) => Content;
		/** Подпись кнопки удаления */
		deleteLabel?: Content;
		/** Подпись кнопки отмены */
		cancelLabel?: Content;
		/** Клик по "Удалить", аргумент - ключи выбранных строк (выбор сбрасывается после вызова) */
		onDelete?: (selectedRows: string[]) => void;
		/** Клик по "Отмена", аргумент - ключи выбранных строк (выбор сбрасывается после вызова) */
		onCancel?: (selectedRows: string[]) => void;
		/** Скрывает кнопку удаления */
		hideDelete?: boolean;
		/** Скрывает кнопку отмены */
		hideCancel?: boolean;
		/** Дополнительное содержимое между счётчиком и кнопками */
		children?: Snippet;
		/** Дополнительные классы корневого элемента */
		class?: string;
	}

	let {
		selectedLabel = (count: number) => `${count} выбрано`,
		deleteLabel = 'Удалить',
		cancelLabel = 'Отмена',
		onDelete,
		onCancel,
		hideDelete = false,
		hideCancel = false,
		children,
		class: className
	}: Props = $props();

	const selection = useSelection();
	const selectedCount = $derived(selection.selectedRows.length);

	const handleCheckboxChange = (checked: boolean) => {
		if (!checked) selection.clearSelection();
	};
	const handleDelete = () => {
		onDelete?.(selection.selectedRows);
		selection.clearSelection();
	};
	const handleCancel = () => {
		onCancel?.(selection.selectedRows);
		selection.clearSelection();
	};
</script>

{#snippet trashIcon()}<Trash />{/snippet}
{#snippet closeIcon()}<CloseLarge />{/snippet}

{#if selectedCount !== 0}
	<div class={clsx('atmr-tablegrid__actionbar', className)}>
		<div class="atmr-tablegrid__actionbar__selection">
			<div class="atmr-tablegrid__actionbar__checkbox"><Checkbox variant="primary" checked onChange={handleCheckboxChange} /></div>
			<span class="atmr-tablegrid__actionbar__count"><Slot content={selectedLabel(selectedCount)} /></span>
		</div>
		{@render children?.()}
		<div class="atmr-tablegrid__actionbar__actions">
			{#if !hideDelete}<FunctionButton variant="primary" icon={trashIcon} iconPosition="left" label={deleteLabel} onclick={handleDelete} />{/if}
			{#if !hideCancel}<FunctionButton variant="tertiary" icon={closeIcon} iconPosition="left" label={cancelLabel} onclick={handleCancel} />{/if}
		</div>
	</div>
{/if}
