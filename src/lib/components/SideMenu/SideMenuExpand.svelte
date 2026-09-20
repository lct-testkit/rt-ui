<script lang="ts">
	// Port of packages/sidemenu/src/react/SideMenuExpand.tsx
	// "Expand / Collapse" row (`isOpened` = the extra items are shown); the label is shown only while the menu is open.
	import clsx from 'clsx';
	import ListItem from '../List/ListItem.svelte';
	import type { SideMenuListItemBase } from './types.js';
	import ChevronUp from '../../icons/24/navigation/ChevronUp.svelte';
	import { useSideMenu } from './context.js';

	export interface SideMenuExpandProps extends SideMenuListItemBase {
		/** Дополнительные элементы раскрыты */
		isOpened?: boolean;
		[key: string]: unknown;
	}

	let { isOpened, class: className, ref = $bindable(null), ...tail }: SideMenuExpandProps = $props();

	const sideMenu = useSideMenu();
</script>

{#snippet chevron()}
	<ChevronUp class={clsx('atmr-side-menu__chevron', !isOpened && 'atmr-side-menu__chevron--rotated')} />
{/snippet}

<ListItem bind:ref prefix={chevron} class={clsx('atmr-side-menu__item', 'atmr-side-menu__expand', className)} {...tail}>
	{#if sideMenu.isMenuOpen}{isOpened ? 'Свернуть' : 'Развернуть'}{/if}
</ListItem>
