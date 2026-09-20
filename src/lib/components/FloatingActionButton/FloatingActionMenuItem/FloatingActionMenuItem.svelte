<script lang="ts">
	// Port of packages/ui-kit/src/components/FloatingActionButton/FloatingActionMenuItem/FloatingActionMenuItem.tsx
	import clsx from 'clsx';
	import Slot from '../../../internal/Slot.svelte';
	import type { Content } from '../../../internal/types.js';
	import type { FloatingActionButtonSize, FloatingActionButtonVariant } from '../FloatingActionButton/constants.js';

	interface Props {
		/** Задаёт вариант для компонента */
		variant?: FloatingActionButtonVariant;
		/** Задает размер */
		size?: FloatingActionButtonSize;
		/** Иконка (используется как iconSuffix, если он не задан) */
		icon?: Content;
		/** Иконка в «начале» */
		iconPrefix?: Content;
		/** Иконка в «конце» */
		iconSuffix?: Content;
		/** Текст пункта меню */
		label?: string;
		/** Тег ссылки */
		tag?: string;
		class?: string;
		onclick?: (event: MouseEvent) => void;
		// href, target and any other attribute of the inner element
		[key: string]: unknown;
	}

	let {
		variant = 'primary',
		size = 'l',
		icon,
		iconPrefix,
		iconSuffix: iconSuffixProp,
		label,
		tag = 'a',
		onclick,
		class: className,
		...rest
	}: Props = $props();

	// React passes `label` to the link element as an attribute as well
	const labelAttr = $derived<Record<string, unknown>>({ label });
	const iconSuffix = $derived(iconSuffixProp != null ? iconSuffixProp : icon);
	const rootClass = $derived(
		clsx('atmr-floating-action-menu-item', `atmr-floating-action-menu-item--${variant}`, `atmr-floating-action-menu-item--size-${size}`, label && 'atmr-floating-action-menu-item--with-text', className)
	);
</script>

<li class={rootClass}>
	<svelte:element this={tag} class="atmr-floating-action-menu-item__link" {...labelAttr} {onclick} {...rest}>
		<Slot content={iconPrefix} />{#if label}<span>{label}</span>{/if}<Slot content={iconSuffix} />
	</svelte:element>
</li>
