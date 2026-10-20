<script lang="ts">
	// Port of packages/sidemenu/src/react/SideMenuItem.tsx
	//
	//   <SideMenuItem selected onclick={...} variant="wrap|truncate" suffix={badge}>{#snippet prefix()}<Home />{/snippet}Text</SideMenuItem>
	//
	// A ListItem (`<li class="atmr-box atmr-list-item atmr-side-menu__item [--wrap|--truncate]">`). While the menu is collapsed the label
	// and the suffix are not rendered (only the prefix icon) - unless the item lives in the popover of a collapsed SideMenuCollapse
	// (then the click also closes that popover). `variant="truncate"` adds `title="<text>"` (React: `children.toString()`).
	//
	// [ext, not in original] `href`: the item is a real link. An empty `<a href>` is laid over the row (`.atmr-side-menu__link`, the row itself stays an
	// `<li>` and looks the same), so middle click / Ctrl- or ⌘-click / "open in a new tab" and Enter on a focused item work like on any link. A plain click
	// still goes to `onclick` (the app routes client-side) with the browser navigation cancelled; without `onclick` the browser follows the link.
	// The link's name is `aria-label` / `title` of the item or, failing that, the rendered label text.
	import clsx from 'clsx';
	import type { Snippet } from 'svelte';
	import ListItem from '../List/ListItem.svelte';
	import Slot from '../../internal/Slot.svelte';
	import type { SideMenuListItemBase } from './types.js';
	import type { Content } from '../../internal/types.js';
	import { useSideMenu, useSideMenuCollapse, useSideMenuPopoverContent } from './context.js';

	export interface SideMenuItemProps extends SideMenuListItemBase {
		/** Вариант отображения длинного текста: перенос или обрезка */
		variant?: 'wrap' | 'truncate';
		/** Контент в «конце» элемента (показывается только в раскрытом меню) */
		suffix?: Content;
		/** [ext] Адрес: пункт становится настоящей ссылкой (новая вкладка по средней кнопке и Ctrl-клику, Enter) */
		href?: string;
		children?: Snippet;
		[key: string]: unknown;
	}

	let { class: className, variant, children, suffix, onclick, href, prefix, selected, ref = $bindable(null), ...tail }: SideMenuItemProps = $props();

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

	// the name of the link: explicit, else the label text that is rendered while the menu is open
	const contentText = $derived(href && showContent && ref ? ref.querySelector('.atmr-list-item__content')?.textContent?.trim() || undefined : undefined);
	const linkLabel = $derived((tail['aria-label'] as string | undefined) ?? (tail.title as string | undefined) ?? contentText);

	function handleClick(event: MouseEvent) {
		if (href) {
			// new tab / window (Ctrl, ⌘, Shift, Alt) belongs to the browser
			if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
			if (onclick) event.preventDefault();
		}
		onclick?.(event);
		if (inPopoverContent) {
			collapse.closePopover();
		}
	}
</script>

{#snippet link()}
	<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- the app (not the library) decides how links are resolved -->
	<a class="atmr-side-menu__link" {href} aria-label={linkLabel} aria-current={selected ? 'page' : undefined} data-testid="side-menu-link"></a>
{/snippet}
{#snippet prefixWithLink()}{@render link()}<Slot content={prefix} />{/snippet}

<ListItem
	title={'title' in tail ? (tail.title as string | undefined) : titleText}
	{...tail}
	{selected}
	prefix={href && prefix ? prefixWithLink : prefix}
	onclick={onclick || inPopoverContent || href ? handleClick : undefined}
	suffix={showContent ? suffix : undefined}
	bind:ref
	class={clsx('atmr-side-menu__item', variant === 'wrap' && 'atmr-side-menu__item--wrap', variant === 'truncate' && 'atmr-side-menu__item--truncate', className)}
>
	{#if href && !prefix}{@render link()}{/if}
	{#if showContent}{@render children?.()}{/if}
</ListItem>
