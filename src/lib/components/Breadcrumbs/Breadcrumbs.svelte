<script lang="ts">
	// Port of packages/ui-kit/src/components/Breadcrumbs/Breadcrumbs.tsx
	//
	//   {#snippet home()}<a href="#home">Главная</a>{/snippet}  ...
	//   <Breadcrumbs children={[home, profile, requests]} maxCrumbs={5} maxVisibleCrumbs={3} />
	//
	// React `children` is an ARRAY of elements (`children.length`, `children.slice(...)`), so `children` is an array of nodes (`Content[]`:
	// snippets / strings) here - pass it as an attribute (`children={[...]}`), not as content between the tags.
	//
	// DOM (identical to React):
	//   <div class="atmr-breadcrumbs atmr-breadcrumbs--size-s atmr-breadcrumbs--primary atmr-breadcrumbs--color-scheme-neutral" ...rest>
	//     <span role="button" tabindex="0" aria-disabled="false" class="atmr-breadcrumbs__item"><span class="atmr-breadcrumbs__text">{crumb}</span></span>
	//     <div class="atmr-breadcrumbs__divider"></div>
	//     ...   the separator after the FIRST crumb is the "more" button inside a DropdownMenu when crumbs are collapsed
	//     <div class="atmr-dropdown-menu-root"><button class="atmr-breadcrumbs__dividermenu" aria-label="breadcrumbs dividermenu" data-active>{moreIcon}</button>...</div>
	//
	// Crumbs count > `maxCrumbs`: the first crumb, the "more" menu (holding the hidden crumbs) and the last `maxVisibleCrumbs - 1` crumbs are shown.
	// `maxVisibleCrumbs >= children.length` makes `maxCrumbs = maxVisibleCrumbs` (nothing is collapsed). `hideCurrent` hides the last crumb.
	import clsx from 'clsx';
	import type { HTMLAttributes } from 'svelte/elements';
	import Slot from '../../internal/Slot.svelte';
	import type { Content } from '../../internal/types.js';
	import More from '../../icons/24/navigation/More.svelte';
	import type { UsePopperOptions } from '../../hooks/usePopper.svelte.js';
	import type { ColorScheme } from '../../constants.js';
	import { styleToString, type StyleValue } from '../../utils/style.js';
	import DropdownMenu from '../DropdownMenu/DropdownMenu.svelte';
	import type { DropdownMenuItem } from '../DropdownMenu/types.js';
	import {
		BREADCRUMBS_SIZES,
		BREADCRUMBS_VARIANTS,
		DEFAULT_CRUMBS_MAX_COUNT,
		DEFAULT_MAX_VISIBLE_CRUMBS,
		DEFAULT_SIZE,
		DEFAULT_VARIANT,
		type BreadcrumbsSize,
		type BreadcrumbsVariant
	} from './constants.js';

	export interface BreadcrumbsProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'style'> {
		/** Задаёт вариант для компонента */
		variant?: BreadcrumbsVariant;
		/** Задаёт размер */
		size?: BreadcrumbsSize;
		/** Дочерние элементы (хлебные крошки): массив узлов */
		children?: Content[];
		/** Максимальное количество ссылок; если оно больше, чем элементов в children, меню (divider) не показывается */
		maxCrumbs?: number;
		/** Максимальное количество видимых ссылок, которые не будут скрываться в меню (divider) */
		maxVisibleCrumbs?: number;
		/** Задаёт вариант использования с Portal */
		useInPortal?: boolean;
		/** Кастомная иконка кнопки меню */
		moreIcon?: Content;
		/** Окрашивать ли текст элемента при выборе */
		isSelectedItemColored?: boolean;
		/** Параметры для popper.js */
		usePopperProps?: UsePopperOptions;
		/** Дополнительные классы для выпадающего меню */
		dropdownMenuClassName?: string;
		/** Дополнительные стили для выпадающего меню */
		dropdownMenuStyle?: StyleValue;
		/** Цветовая схема компонента */
		colorScheme?: ColorScheme;
		/** Скрывает активную ссылку */
		hideCurrent?: boolean;
		/** Стили корневого элемента (строка или объект как в React) */
		style?: StyleValue;
	}

	let {
		variant = DEFAULT_VARIANT,
		children = [],
		size = DEFAULT_SIZE,
		maxCrumbs: maxCrumbsProp = DEFAULT_CRUMBS_MAX_COUNT,
		maxVisibleCrumbs: maxVisibleCrumbsProp = DEFAULT_MAX_VISIBLE_CRUMBS,
		useInPortal,
		class: className,
		moreIcon,
		isSelectedItemColored,
		usePopperProps,
		dropdownMenuClassName,
		dropdownMenuStyle,
		colorScheme = 'neutral',
		hideCurrent = false,
		style,
		...restProps
	}: BreadcrumbsProps = $props();

	let isOpenDropdown = $state(false);

	const maxVisibleCrumbs = $derived(maxVisibleCrumbsProp > 0 ? maxVisibleCrumbsProp - 1 : maxVisibleCrumbsProp);
	const maxCrumbs = $derived(maxVisibleCrumbsProp >= children.length ? maxVisibleCrumbsProp : maxCrumbsProp);
	const hiddenItems = $derived(maxVisibleCrumbs === 0 ? children.slice(1) : children.slice(1, -maxVisibleCrumbs));
	const dropdownItems = $derived<DropdownMenuItem[]>(hiddenItems.map((item, key) => ({ value: item, key: key.toString() })));

	const rootClass = $derived(
		clsx(
			'atmr-breadcrumbs',
			`atmr-breadcrumbs--size-${BREADCRUMBS_SIZES[size]}`,
			`atmr-breadcrumbs--${BREADCRUMBS_VARIANTS[variant]}`,
			`atmr-breadcrumbs--color-scheme-${colorScheme}`,
			className
		)
	);
</script>

<div class={rootClass} {...restProps} style={styleToString(style)}>
	{#each children as breadcrumb, index}
		{#if !(hideCurrent && children.length - 1 === index) && !(children.length > maxCrumbs && index > 0 && index < children.length - maxVisibleCrumbs)}
			<span role="button" tabindex={index === children.length - 1 ? undefined : 0} aria-disabled={index === children.length - 1} class="atmr-breadcrumbs__item">
				<span class="atmr-breadcrumbs__text"><Slot content={breadcrumb} /></span>
			</span>
			{#if index !== children.length - 1}
				{#if children.length > maxCrumbs && children.length - 2 >= maxVisibleCrumbs && index === 0}
					<DropdownMenu
						items={dropdownItems}
						checkIcon={null}
						{variant}
						{size}
						onClose={() => (isOpenDropdown = false)}
						isOpened={isOpenDropdown}
						{useInPortal}
						placement="bottomLeft"
						{isSelectedItemColored}
						usePopperProps={{ offset: 4, widthFitContent: true, ...usePopperProps }}
						{dropdownMenuClassName}
						{dropdownMenuStyle}
					>
						<button
							class="atmr-breadcrumbs__dividermenu"
							type="button"
							aria-label="breadcrumbs dividermenu"
							data-active={isOpenDropdown}
							onclick={() => (isOpenDropdown = !isOpenDropdown)}
						>
							{#if moreIcon === undefined}<More />{:else}<Slot content={moreIcon} />{/if}
						</button>
					</DropdownMenu>
				{:else}
					<div class="atmr-breadcrumbs__divider"></div>
				{/if}
			{/if}
		{/if}
	{/each}
</div>
