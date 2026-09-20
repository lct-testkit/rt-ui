<script lang="ts">
	// Port of packages/ui-kit/src/components/Tag/TagItem/TagItem.tsx
	// `children` is a string (then `maxSymbols` truncates it with "...") or any Content (snippet / number).
	import clsx from 'clsx';
	import type { HTMLAttributes } from 'svelte/elements';
	import CloseLarge16 from '../../../icons/16/navigation/CloseLarge16.svelte';
	import CloseSmall from '../../../icons/24/navigation/CloseSmall.svelte';
	import Slot from '../../../internal/Slot.svelte';
	import type { Content } from '../../../internal/types.js';
	import { DEFAULT_SIZE, DEFAULT_VARIANT, TAG_SIZES, TAG_VARIANTS, warnDeprecatedSecondaryVariant, type TagSize, type TagVariant } from '../constants.js';

	export interface TagItemProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
		/** Размер компонента */
		size?: TagSize;
		/**
		 * Задаёт вариант для компонента.
		 * ⚠️ **Deprecated**: Вариант "secondary" убран в соответствии с дизайном. Используйте variant="primary"
		 */
		variant?: TagVariant;
		/** Показывать кнопку закрытия */
		closable?: boolean;
		/** Устанавливает aria-disabled и блокирует кнопку закрытия */
		disabled?: boolean;
		/** Состояние ошибки (aria-invalid) */
		error?: boolean;
		/** Максимальное количество символов (для строкового children) */
		maxSymbols?: number;
		/** Вызывается при клике на кнопку закрытия */
		onClose?: (event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) => void;
		/** Иконка кнопки закрытия */
		icon?: Content;
		/** Дочерние элементы компонента */
		children?: Content;
		/** Корневой элемент */
		ref?: HTMLDivElement | null;
	}

	let {
		size = DEFAULT_SIZE,
		variant = DEFAULT_VARIANT,
		closable,
		disabled,
		error,
		maxSymbols,
		class: className,
		onClose,
		icon: iconProp,
		children,
		ref = $bindable(null),
		...restProps
	}: TagItemProps = $props();

	if (variant === TAG_VARIANTS.secondary) {
		warnDeprecatedSecondaryVariant('TagItem');
	}

	let text = $derived.by(() => {
		if (typeof children === 'string' && maxSymbols) {
			const textEnd = children.length > maxSymbols ? '...' : '';
			return children.slice(0, maxSymbols) + textEnd;
		}
		return children;
	});

	const rootClass = $derived(clsx('atmr-tagitem', `atmr-tagitem--${TAG_VARIANTS[variant]}`, `atmr-tagitem--size-${TAG_SIZES[size]}`, className));
</script>

<div aria-disabled={disabled} aria-invalid={error} class={rootClass} bind:this={ref} {...restProps}>
	<span class="atmr-tagitem__label" aria-disabled={disabled}><Slot content={text} /></span>
	{#if closable}
		<button type="button" aria-disabled={disabled} {disabled} onclick={onClose} class="atmr-tagitem__closebutton">
			{#if iconProp != null}
				<Slot content={iconProp} />
			{:else if size === 'xs' || size === 's'}
				<CloseSmall size={8} style="transform: scale(2); transform-origin: center;" />
			{:else}
				<CloseLarge16 />
			{/if}
		</button>
	{/if}
</div>
