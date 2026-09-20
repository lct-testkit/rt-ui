<script lang="ts">
	// Port of packages/ui-kit/src/components/FloatingActionButton/FloatingActionButton/FloatingActionButton.tsx
	// (the component is only present inside the FloatingActionButton story bundle of the reference)
	import clsx from 'clsx';
	import Button from '../../Button/Button/Button.svelte';
	import Overlay from '../../Overlay/Overlay.svelte';
	import type { OverlayVariant } from '../../Overlay/constants.js';
	import CloseSmall from '../../../icons/24/navigation/CloseSmall.svelte';
	import FloatingActionMenuItem from '../FloatingActionMenuItem/FloatingActionMenuItem.svelte';
	import type { Content } from '../../../internal/types.js';
	import { useFilterAttrs } from '../../../hooks/useFilterAttrs.js';
	import { noop } from '../../../utils/function.js';
	import { styleToString } from '../../../utils/style.js';
	import { portal } from '../../../actions/portal.js';
	import { DEFAULT_SIZE, DEFAULT_VARIANT, type FloatingActionButtonSize, type FloatingActionButtonVariant } from './constants.js';

	export interface FloatingActionMenuItemProps {
		variant?: FloatingActionButtonVariant;
		size?: FloatingActionButtonSize;
		icon?: Content;
		iconPrefix?: Content;
		iconSuffix?: Content;
		label?: string;
		tag?: string;
		key?: string | number;
		class?: string;
		onclick?: (event: MouseEvent) => void;
		[key: string]: unknown;
	}

	interface Props {
		/** Иконка в «начале» кнопки */
		iconPrefix?: Content;
		/** Иконка в «конце» кнопки */
		iconSuffix?: Content;
		/** Задает размер */
		size?: FloatingActionButtonSize;
		/** Задаёт вариант для компонента */
		variant?: FloatingActionButtonVariant;
		/** Текст лейбла компонента */
		label?: Content;
		/** Пункты меню */
		items?: FloatingActionMenuItemProps[];
		/** Вариант оверлея (если не задан, оверлей не рендерится) */
		overlayVariant?: OverlayVariant;
		/** Иконка кнопки при открытом меню */
		closeMenuIcon?: Content;
		/** Использовать портал (рендер в document.body) */
		useInPortal?: boolean;
		/** Клик по оверлею; получает функцию закрытия меню */
		onClickOverlay?: (close: () => void) => void;
		onclick?: (event: MouseEvent) => void;
		[key: string]: unknown;
	}

	let {
		iconPrefix,
		iconSuffix,
		size = DEFAULT_SIZE,
		variant = DEFAULT_VARIANT,
		label,
		items,
		overlayVariant,
		closeMenuIcon,
		useInPortal = true,
		onclick = noop,
		onClickOverlay = noop,
		...otherProps
	}: Props = $props();

	let isOpen = $state(false);

	const [rootAttrs, restAttrs] = $derived(useFilterAttrs(otherProps));
	const { class: rootClassProp, style: rootStyle, ...rootRest } = $derived(rootAttrs);

	const onClose = () => (isOpen = false);

	const hasItems = $derived(!!items?.length);
	const rootClass = $derived(
		clsx(
			'atmr-floating-action-button',
			`atmr-floating-action-button--${variant}`,
			`atmr-floating-action-button--size-${size}`,
			isOpen && 'atmr-floating-action-button--open-menu',
			label && 'atmr-floating-action-button--with-label',
			rootClassProp
		)
	);

	function clickHandler(e: MouseEvent) {
		if (items?.length && items.length > 0) isOpen = !isOpen;
		onclick(e);
	}

	function maybePortal(node: HTMLElement, enabled: boolean) {
		const instance = enabled ? portal(node, undefined) : undefined;
		return {
			destroy() {
				instance?.destroy?.();
			}
		};
	}
</script>

{#snippet defaultCloseIcon()}<CloseSmall />{/snippet}

<div {...rootRest} class={rootClass} style={styleToString(rootStyle)} use:maybePortal={useInPortal}>
	{#if overlayVariant}
		<Overlay class="atmr-floating-action-button__overlay" variant={overlayVariant} onclick={() => onClickOverlay(onClose)} isOpened={isOpen} useInPortal={false} />
	{/if}
	<Button
		class="atmr-floating-action-button__button"
		label={!isOpen && label}
		{variant}
		{size}
		iconPrefix={isOpen ? (closeMenuIcon === undefined ? defaultCloseIcon : closeMenuIcon) : iconPrefix}
		iconSuffix={isOpen ? null : iconSuffix}
		onclick={clickHandler}
		{...restAttrs}
	/>
	{#if items?.length === 0}0{:else if hasItems && isOpen}
		<ul class="atmr-floating-action-button__menu">
			{#each items ?? [] as item}
				{@const { key: _key, onclick: itemOnclick, ...itemProps } = item}
				<FloatingActionMenuItem
					{...itemProps}
					{variant}
					{size}
					onclick={(e: MouseEvent) => {
						onClose();
						if (itemOnclick) itemOnclick(e);
					}}
				/>
			{/each}
		</ul>
	{/if}
</div>
