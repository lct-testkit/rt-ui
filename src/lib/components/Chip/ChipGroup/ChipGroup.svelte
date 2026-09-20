<script lang="ts">
	// Port of packages/ui-kit/src/components/Chip/ChipGroup/ChipGroup.tsx
	// (React declares it in the same webpack module as its story; the file structure follows the import path
	//  `@atomaro/ui-kit/components/Chip/ChipGroup/ChipGroup`).
	// Renders the chips and, below them, the `contentItems` of every selected chip (or of all chips when nothing is selected).
	import clsx from 'clsx';
	import type { HTMLAttributes } from 'svelte/elements';
	import Slot from '../../../internal/Slot.svelte';
	import type { Content } from '../../../internal/types.js';
	import { styleToString, type StyleValue } from '../../../utils/style.js';
	import Chip from '../Chip/Chip.svelte';
	import { CHIP_SIZES, CHIP_VARIANTS, DEFAULT_CHIP_TOTAL_LABEL, type ChipSize, type ChipVariant } from '../constants.js';

	export interface ChipType {
		key: string;
		label: Content;
		/** React nodes rendered under the chips when the chip is selected (Svelte: snippets / strings) */
		contentItems: Content[];
	}

	export interface ChipGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onchange'> {
		/** Задаёт вариант для компонента */
		variant?: ChipVariant;
		/** Размер компонента */
		size?: ChipSize;
		/** Элементы группы */
		items?: ChipType[];
		/** Контролируемые выбранные элементы */
		selectedItems?: string[];
		/** Начальные выбранные элементы */
		defaultSelectedItems?: string[];
		/** Заблокированные элементы */
		disabledItems?: string[];
		/** Вызывается при клике на чип (получает key) */
		onChange?: (id: string) => void;
		/** Показывать чип «Все» */
		chipTotal?: boolean;
		/** Текст чипа «Все» */
		chipTotalLabel?: Content;
		/** Пропсы контейнера с содержимым выбранных чипов */
		itemsContainerProps?: Omit<HTMLAttributes<HTMLDivElement>, 'style'> & { style?: StyleValue };
	}

	let {
		variant = 'primary',
		size = 'm',
		items = [],
		selectedItems,
		defaultSelectedItems = [],
		disabledItems = [],
		onChange = () => {},
		chipTotal: showChipTotal = false,
		chipTotalLabel = DEFAULT_CHIP_TOTAL_LABEL,
		itemsContainerProps,
		class: className,
		...restProps
	}: ChipGroupProps = $props();

	// svelte-ignore state_referenced_locally
	let groupSelected = $state.raw<string[]>(defaultSelectedItems);

	// useEffect(..., [groupSelected, selectedItems])
	$effect.pre(() => {
		if (selectedItems !== undefined && selectedItems.join() !== groupSelected.join() && selectedItems.length > 0) {
			groupSelected = selectedItems;
		}
	});

	const chipsTotalAmount = $derived(items.reduce((sum, currentValue) => sum + currentValue.contentItems.length, 0));

	function changeHandler(id: string) {
		if (!id) {
			return;
		}
		if (selectedItems === undefined) {
			const newGroupSelected = [...groupSelected];
			const indexValue = newGroupSelected.findIndex((key) => id === key);
			if (indexValue === -1) {
				newGroupSelected.push(id);
			} else {
				newGroupSelected.splice(indexValue, 1);
			}
			groupSelected = newGroupSelected;
		}
		onChange(id);
	}

	function deselectAllHandler() {
		groupSelected = [];
	}

	const itemsContent = $derived(
		items.reduce<Content[]>((prevValue, currentValue) => {
			if ((groupSelected.length === 0 || groupSelected.includes(currentValue.key)) && !disabledItems.includes(currentValue.key)) {
				return [...prevValue, ...currentValue.contentItems];
			}
			return [...prevValue];
		}, [])
	);

	const rootClass = $derived(clsx('atmr-chip-group', className));
	const containerAttrs = $derived.by(() => {
		const { style, ...others } = itemsContainerProps ?? {};
		return { ...others, style: styleToString(style) };
	});
</script>

<div class={rootClass} {...restProps}>
	<div class="atmr-chip-group__inner">
		{#if showChipTotal}
			<Chip
				label={chipTotalLabel}
				counter={chipsTotalAmount}
				{variant}
				{size}
				selected={groupSelected.length === 0 || groupSelected.length === items.length}
				onclick={deselectAllHandler}
			/>
		{/if}
		{#each items as chip (chip.key)}
			<Chip
				id={chip.key}
				label={chip.label}
				counter={chip.contentItems.length}
				{variant}
				{size}
				selected={groupSelected.includes(chip.key)}
				disabled={disabledItems.includes(chip.key)}
				onclick={() => changeHandler(chip.key)}
			/>
		{/each}
	</div>
</div>
<div class="atmr-chip-group__content" {...containerAttrs}>
	{#each itemsContent as item}<Slot content={item} />{/each}
</div>
