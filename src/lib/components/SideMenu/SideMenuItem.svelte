<script lang="ts">
	// Port of packages/sidemenu/src/react/SideMenuItem.tsx
	//
	//   <SideMenuItem selected onclick={...} variant="wrap|truncate" suffix={badge}>{#snippet prefix()}<Home />{/snippet}Text</SideMenuItem>
	//
	// A ListItem (`<li class="atmr-box atmr-list-item atmr-side-menu__item [--wrap|--truncate]">`). While the menu is collapsed the label
	// and the suffix are not rendered (only the prefix icon) - unless the item lives in the popover of a collapsed SideMenuCollapse
	// (then the click also closes that popover). `variant="truncate"` adds `title="<text>"` (React: `children.toString()`).
	import clsx from 'clsx';
	import type { Snippet } from 'svelte';
	import ListItem from '../List/ListItem.svelte';
	import type { SideMenuListItemBase } from './types.js';
	import type { Content } from '../../internal/types.js';
	import { useSideMenu, useSideMenuCollapse, useSideMenuPopoverContent } from './context.js';

	export interface SideMenuItemProps extends SideMenuListItemBase {
		/** Вариант отображения длинного текста: перенос или обрезка */
		variant?: 'wrap' | 'truncate';
		/** Контент в «конце» элемента (показывается только в раскрытом меню) */
		suffix?: Content;
		children?: Snippet;
		[key: string]: unknown;
	}

	let { class: className, variant, children, suffix, onclick, ref = $bindable(null), ...tail }: SideMenuItemProps = $props();

	const sideMenu = useSideMenu();
	const inPopoverContent = useSideMenuPopoverContent();
	const collapse = useSideMenuCollapse();

	const showContent = $derived(sideMenu.isMenuOpen || inPopoverContent);

	// React: title = children.toString() (variant truncate). Svelte cannot stringify a snippet: read the rendered text instead.
	let titleText = $state<string | undefined>(undefined);
	$effect(() => {
		titleText =
			variant === 'truncate' && showContent && ref ? (ref.querySelector('.atmr-list-item__content')?.textContent ?? undefined) : undefined;
	});

	function handleClick(event: MouseEvent) {
		onclick?.(event);
		if (inPopoverContent) {
			collapse.closePopover();
		}
	}
</script>

<ListItem
	title={'title' in tail ? (tail.title as string | undefined) : titleText}
	{...tail}
	onclick={onclick || inPopoverContent ? handleClick : undefined}
	suffix={showContent ? suffix : undefined}
	bind:ref
	class={clsx('atmr-side-menu__item', variant === 'wrap' && 'atmr-side-menu__item--wrap', variant === 'truncate' && 'atmr-side-menu__item--truncate', className)}
>
	{#if showContent}{@render children?.()}{/if}
</ListItem>
