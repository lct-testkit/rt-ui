<script lang="ts">
	// Port of packages/sidemenu/src/react/SideMenuHideButton.tsx
	// "Collapse" button: <li class="... atmr-side-menu__item atmr-side-menu__hide-button"> with a rotating chevron; the label
	// "Свернуть" is shown only while the menu is open (or `isOpened`).
	import clsx from 'clsx';
	import ListItem from '../List/ListItem.svelte';
	import type { SideMenuListItemBase } from './types.js';
	import ChevronRight from '../../icons/24/navigation/ChevronRight.svelte';
	import { useSideMenu } from './context.js';

	export interface SideMenuHideButtonProps extends SideMenuListItemBase {
		/** Показывать состояние «раскрыто» независимо от меню */
		isOpened?: boolean;
		[key: string]: unknown;
	}

	let { isOpened, class: className, ref = $bindable(null), ...tail }: SideMenuHideButtonProps = $props();

	const sideMenu = useSideMenu();
	const isChevronRotated = $derived(isOpened || sideMenu.isMenuOpen);
</script>

{#snippet chevron()}
	<ChevronRight class={clsx('atmr-side-menu__chevron', isChevronRotated && 'atmr-side-menu__chevron--rotated')} />
{/snippet}

<ListItem bind:ref prefix={chevron} class={clsx('atmr-side-menu__item', 'atmr-side-menu__hide-button', className)} {...tail}>
	{#if isChevronRotated}Свернуть{/if}
</ListItem>
