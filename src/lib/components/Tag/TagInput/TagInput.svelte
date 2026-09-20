<script lang="ts">
	// Port of packages/ui-kit/src/components/Tag/TagInput/TagInput.tsx
	// React `onChange` / `onBlur` / `onKeyDown` of the <input> are the DOM `oninput` / `onblur` / `onkeydown` here
	// (React's onChange fires on every keystroke = the native `input` event).
	import clsx from 'clsx';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { noop } from '../../../utils/noop.js';
	import { DEFAULT_SIZE, DEFAULT_VARIANT, TAG_SIZES, TAG_VARIANTS, warnDeprecatedSecondaryVariant, type TagSize, type TagVariant } from '../constants.js';

	export interface TagInputProps extends Omit<HTMLInputAttributes, 'size' | 'children'> {
		/** Значение поля */
		value?: string;
		/** Размер компонента */
		size?: TagSize;
		/**
		 * Задаёт вариант для компонента.
		 * ⚠️ **Deprecated**: Вариант "secondary" убран в соответствии с дизайном. Используйте variant="primary"
		 */
		variant?: TagVariant;
		/** Элемент input */
		ref?: HTMLInputElement | null;
	}

	let {
		value,
		size = DEFAULT_SIZE,
		variant = DEFAULT_VARIANT,
		class: className,
		oninput,
		onblur = noop,
		onkeydown = noop,
		ref = $bindable(null),
		...restProps
	}: TagInputProps = $props();

	if (variant === TAG_VARIANTS.secondary) {
		warnDeprecatedSecondaryVariant('TagInput');
	}

	const rootClass = $derived(clsx('atmr-taginput', `atmr-taginput--${TAG_VARIANTS[variant]}`, `atmr-taginput--size-${TAG_SIZES[size]}`, className));
</script>

<input type="text" bind:this={ref} class={rootClass} disabled={false} {value} {oninput} {onblur} {onkeydown} {...restProps} />
