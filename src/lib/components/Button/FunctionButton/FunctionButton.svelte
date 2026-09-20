<script lang="ts">
	// Port of packages/ui-kit/src/components/Button/FunctionButton/FunctionButton.tsx
	import clsx from 'clsx';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import Slot from '../../../internal/Slot.svelte';
	import type { Content } from '../../../internal/types.js';
	import { DEFAULT_SIZE, DEFAULT_VARIANT, type FunctionButtonSize, type FunctionButtonVariant, type IconPosition } from './constants.js';

	interface Props extends Omit<HTMLButtonAttributes, 'children'> {
		/** Задаёт вариант для компонента */
		variant?: FunctionButtonVariant;
		/** Задает размер */
		size?: FunctionButtonSize;
		/** Иконка компонента */
		icon?: Content;
		/** Позиция иконки относительно текста */
		iconPosition?: IconPosition;
		/** Текст лейбла компонента */
		label?: Content;
		/** Устанавливает атрибут disabled */
		disabled?: boolean;
	}

	let {
		variant = DEFAULT_VARIANT,
		size = DEFAULT_SIZE,
		icon,
		iconPosition = 'right',
		label,
		disabled,
		class: className,
		...rest
	}: Props = $props();

	const rootClass = $derived(
		clsx('atmr-functionbutton', `atmr-functionbutton--${variant}`, `atmr-functionbutton--size-${size}`, `atmr-functionbutton--icon-position-${iconPosition}`, className)
	);
</script>

<button type="button" {disabled} class={rootClass} {...rest}>
	{#if iconPosition === 'left'}
		<Slot content={icon} />{#if label}<span class="atmr-functionbutton__label"><Slot content={label} /></span>{/if}
	{:else}
		{#if label}<span class="atmr-functionbutton__label"><Slot content={label} /></span>{/if}<Slot content={icon} />
	{/if}
</button>
