<script lang="ts">
	// Port of packages/ui-kit/src/components/Stepper/Stepper.tsx
	import clsx from 'clsx';
	import type { HTMLAttributes } from 'svelte/elements';
	import AddSmall from '../../icons/24/action/AddSmall.svelte';
	import RemoveSmall from '../../icons/24/action/RemoveSmall.svelte';
	import Slot from '../../internal/Slot.svelte';
	import type { Content } from '../../internal/types.js';
	import { STEPPER_SIZE_DEFAULT, STEPPER_VARIANT_DEFAULT } from './constants.js';
	import type { StepperDisabled, StepperSize, StepperVariant } from './constants.js';

	interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
		/** Размер */
		size?: StepperSize;
		/** Вариант */
		variant?: StepperVariant;
		/** Блокировка: обеих кнопок (all), левой (left) или правой (right) */
		disabled?: StepperDisabled;
		/** Иконка левой кнопки (по умолчанию «минус») */
		iconPrefix?: Content;
		/** Иконка правой кнопки (по умолчанию «плюс») */
		iconSuffix?: Content;
		/** Значение между кнопками (без него — разделитель) */
		label?: Content;
		/** Клик по левой кнопке */
		onClickIconPrefix?: () => void;
		/** Клик по правой кнопке */
		onClickIconSuffix?: () => void;
	}

	let {
		class: className = '',
		variant = STEPPER_VARIANT_DEFAULT,
		disabled,
		iconPrefix,
		iconSuffix,
		size = STEPPER_SIZE_DEFAULT,
		label,
		onClickIconPrefix,
		onClickIconSuffix,
		...rest
	}: Props = $props();

	const isAllDisabled = $derived(disabled === 'all');
	const isLeftDisabled = $derived(isAllDisabled || disabled === 'left');
	const isRightDisabled = $derived(isAllDisabled || disabled === 'right');

	const handleLeftClick = () => {
		if (onClickIconPrefix && !isLeftDisabled) onClickIconPrefix();
	};
	const handleRightClick = () => {
		if (onClickIconSuffix && !isRightDisabled) onClickIconSuffix();
	};

	const rootClass = $derived(clsx('atmr-stepper', `atmr-stepper--size-${size}`, `atmr-stepper--${variant}`, { 'atmr-stepper--disabled': isAllDisabled }, className && className));
</script>

<div class={rootClass} {...rest}>
	<button type="button" class="atmr-stepper__button atmr-stepper__button--prev" disabled={isLeftDisabled || isAllDisabled} onclick={handleLeftClick}>
		{#if iconPrefix}<Slot content={iconPrefix} />{:else}<RemoveSmall />{/if}
	</button>
	{#if label}
		<div class="atmr-stepper__label"><Slot content={label} /></div>
	{:else}
		<span class="atmr-stepper__divider"></span>
	{/if}
	<button type="button" class="atmr-stepper__button atmr-stepper__button--next" disabled={isRightDisabled || isAllDisabled} onclick={handleRightClick}>
		{#if iconSuffix}<Slot content={iconSuffix} />{:else}<AddSmall />{/if}
	</button>
</div>
