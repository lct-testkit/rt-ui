<script lang="ts">
	// Port of packages/ui-kit/src/components/Button/IconButton/IconButton.tsx
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
		/** Иконка компонента */
		icon?: Content;
		/** Устанавливает атрибут disabled */
		disabled?: boolean;
	}

	let { size = 'm', variant = 'primary', colorScheme = 'accent', icon, class: className, disabled, ...rest }: Props = $props();

	const rootClass = $derived(clsx('atmr-icon-button', `atmr-icon-button--${variant}-${colorScheme}`, `atmr-icon-button--size-${size}`, className));
</script>

<button class={rootClass} {disabled} type="button" {...rest}><Slot content={icon} /></button>
