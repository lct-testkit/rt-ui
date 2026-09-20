<script lang="ts">
	// Port of packages/ui-kit/src/components/Chip/Chip/Chip.tsx
	// Controlled (`selected`) / uncontrolled (`defaultSelected`): a click toggles the local state only when `selected` is undefined;
	// when `selected` is given the rendered state always follows it.
	import clsx from 'clsx';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import Slot from '../../../internal/Slot.svelte';
	import type { Content } from '../../../internal/types.js';
	import { CHIP_SIZES, CHIP_VARIANTS, type ChipSize, type ChipVariant } from '../constants.js';

	export interface ChipProps extends Omit<HTMLButtonAttributes, 'children'> {
		/** Задаёт вариант для компонента */
		variant?: ChipVariant;
		/** Счётчик в конце чипа */
		counter?: number | string;
		/** Текст лейбла компонента */
		label?: Content;
		/** Размер компонента */
		size?: ChipSize;
		/** Контролируемое выбранное состояние */
		selected?: boolean;
		/** Начальное выбранное состояние (неконтролируемый режим) */
		defaultSelected?: boolean;
		/** Устанавливает атрибут disabled */
		disabled?: boolean;
		/** Иконка в начале чипа */
		icon?: Content;
	}

	let {
		variant = 'primary',
		counter,
		label,
		size = 'm',
		selected,
		defaultSelected = false,
		disabled = false,
		icon,
		class: className,
		onclick = () => {},
		...restProps
	}: ChipProps = $props();

	// svelte-ignore state_referenced_locally
	let isSelected = $state(defaultSelected);

	function clickHandler(evt: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
		if (selected === undefined) {
			isSelected = !isSelected;
		}
		(onclick as (evt: MouseEvent) => void)(evt);
	}

	// useEffect(..., [isSelected, selected])
	$effect.pre(() => {
		if (selected !== undefined && selected !== isSelected) {
			isSelected = selected;
		}
	});

	const rootClass = $derived(clsx('atmr-chip', `atmr-chip--${variant}`, `atmr-chip--size-${size}`, isSelected && 'atmr-chip--selected', className));
</script>

<button type="button" class={rootClass} {disabled} onclick={clickHandler} {...restProps}>
	{#if !!icon}<span class="atmr-chip__icon"><Slot content={icon} /></span>{/if}
	<span class="atmr-chip__label"><Slot content={label} /></span>
	{#if counter || counter === 0}<span class="atmr-chip__counter">{counter}</span>{/if}
</button>
