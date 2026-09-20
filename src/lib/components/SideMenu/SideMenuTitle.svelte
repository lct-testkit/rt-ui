<script lang="ts">
	// Port of packages/sidemenu/src/react/SideMenuTitle.tsx
	// A category title (`<li class="atmr-box atmr-list-item atmr-side-menu__title">`); while the menu is collapsed the text is replaced
	// with a single space (unless `isOpened`, used for the title of the collapse popover).
	import clsx from 'clsx';
	import type { Snippet } from 'svelte';
	import ListItem from '../List/ListItem.svelte';
	import type { SideMenuListItemBase } from './types.js';
	import { useSideMenu } from './context.js';

	export interface SideMenuTitleProps extends SideMenuListItemBase {
		/** Показывать текст независимо от состояния меню */
		isOpened?: boolean;
		children?: Snippet;
		[key: string]: unknown;
	}

	let { class: className, isOpened, children, ref = $bindable(null), ...tail }: SideMenuTitleProps = $props();

	const sideMenu = useSideMenu();
	const show = $derived(isOpened || sideMenu.isMenuOpen);
</script>

<ListItem {...tail} bind:ref class={clsx('atmr-side-menu__title', className)}>{#if show}{@render children?.()}{:else}{' '}{/if}</ListItem>
