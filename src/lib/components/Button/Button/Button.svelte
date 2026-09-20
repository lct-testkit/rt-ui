<script lang="ts">
	// Port of packages/ui-kit/src/components/Button/Button/Button.tsx
	import clsx from 'clsx';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import Slot from '../../../internal/Slot.svelte';
	import type { Content } from '../../../internal/types.js';
	import type { ColorScheme, Size, Variant } from '../../../constants.js';

	interface Props extends Omit<HTMLButtonAttributes, 'children'> {
		/** Задает размер */
		size?: Size;
		/** Задаёт вариант для компонента */
		variant?: Variant;
		/** Цветовая схема компонента */
		colorScheme?: ColorScheme;
		/** Иконка в «начале» компонента */
		iconPrefix?: Content;
		/** Иконка в «конце» компонента */
		iconSuffix?: Content;
		/** Текст лейбла компонента */
		label?: Content;
		/** Устанавливает атрибут disabled */
		disabled?: boolean;
	}

	let {
		size = 'm',
		variant = 'primary',
		colorScheme = 'accent',
		iconPrefix,
		iconSuffix,
		label,
		disabled = false,
		id = 'button',
		class: className,
		...rest
	}: Props = $props();

</script>

<button class={clsx('atmr-button', `atmr-button--${variant}`, `atmr-button--${colorScheme}`, `atmr-button--size-${size}`, className)} {disabled} type="button" {id} {...rest}>
	{#if iconPrefix}{#if typeof iconPrefix === 'function'}{@render iconPrefix()}{:else}{iconPrefix}{/if}{/if}
	{#if label}<span class="atmr-button__label">{#if typeof label === 'function'}{@render label()}{:else}{label}{/if}</span>{/if}
	{#if iconSuffix}{#if typeof iconSuffix === 'function'}{@render iconSuffix()}{:else}{iconSuffix}{/if}{/if}
</button>
