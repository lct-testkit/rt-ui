<script lang="ts">
	// Port of packages/ui-kit/src/components/SegmentedControl/Segment/Segment.tsx
	// Inside a SegmentedControl (Svelte context) variant / size / disabledAll come from the control and the segment is
	// "pressed" when `activeIndex === index`; clicking an enabled segment calls the control's `handleChange(index)`.
	import clsx from 'clsx';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import Slot from '../../../internal/Slot.svelte';
	import type { Content } from '../../../internal/types.js';
	import { noop } from '../../../utils/noop.js';
	import {
		DEFAULT_SIZE,
		DEFAULT_VARIANT,
		SEGMENTED_CONTROL_SIZES,
		SEGMENTED_CONTROL_VARIANTS,
		type SegmentedControlSize,
		type SegmentedControlVariant
	} from '../constants.js';
	import { getSegmentedControlContext } from '../context.js';

	export interface SegmentProps extends Omit<HTMLButtonAttributes, 'children'> {
		/** Индекс сегмента (сравнивается с value SegmentedControl) */
		index?: string;
		/** Текст лейбла компонента */
		label?: Content;
		/** Иконка в начале сегмента */
		icon?: Content;
		/** Задаёт вариант для компонента (внутри SegmentedControl берётся из него) */
		variant?: SegmentedControlVariant;
		/** Размер компонента (внутри SegmentedControl берётся из него) */
		size?: SegmentedControlSize;
		/** Устанавливает атрибут disabled */
		disabled?: boolean;
	}

	let {
		index,
		label,
		icon,
		variant: variantProp = DEFAULT_VARIANT,
		size: sizeProp = DEFAULT_SIZE,
		onclick = noop,
		disabled: disabledProp = false,
		class: className = '',
		...restProps
	}: SegmentProps = $props();

	const context = getSegmentedControlContext();

	const variant = $derived(context.variant ?? variantProp);
	const size = $derived(context.size ?? sizeProp);
	const isSelected = $derived(context.activeIndex === index);
	const isDisabled = $derived(context.disabledAll || disabledProp);

	function onClickHandler(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
		if (!isDisabled && !!context.handleChange) {
			context.handleChange(index as string);
		}
		(onclick as (event: MouseEvent) => void)(event);
	}

	const rootClass = $derived(
		clsx('atmr-segment', `atmr-segment--${SEGMENTED_CONTROL_VARIANTS[variant]}`, `atmr-segment--size-${SEGMENTED_CONTROL_SIZES[size]}`, className)
	);
</script>

<button class={rootClass} type="button" disabled={isDisabled} aria-pressed={isSelected} onclick={onClickHandler} {...restProps}>
	<Slot content={icon} />
	{#if label}<span class="atmr-segment__label"><Slot content={label} /></span>{/if}
</button>
