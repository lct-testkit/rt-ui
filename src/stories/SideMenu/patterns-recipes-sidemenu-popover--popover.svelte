<script lang="ts">
	// Port of Patterns & Recipes/SideMenu/Popover -> PopoverComponent (initialArgs: isOpened = false: collapsed menu, items in hover tooltips)
	import './_patterns-recipes-sidemenu-popover--popover.css';
	import ListItem from '$lib/components/List/ListItem.svelte';
	import Popover from '$lib/components/Popover/Popover.svelte';
	import SideMenu from '$lib/components/SideMenu/SideMenu.svelte';
	import SideMenuContent from '$lib/components/SideMenu/SideMenuContent.svelte';
	import SideMenuHeader from '$lib/components/SideMenu/SideMenuHeader.svelte';
	import SideMenuItem from '$lib/components/SideMenu/SideMenuItem.svelte';
	import Home from '$lib/icons/24/action/Home.svelte';
	import { noop } from '$lib/utils/noop.js';
	import RTKHeaderContent from './_RTKHeaderContent.svelte';

	let { isOpened = false }: { isOpened?: boolean } = $props();

	const MENU_ITEMS = Array.from({ length: 5 }, (_, i) => ({ key: `item-${i}`, label: `Item text` }));
</script>

{#snippet homeIcon()}<Home />{/snippet}

<div class="stories-main-side-menu">
	<SideMenu {isOpened}>
		<SideMenuHeader><RTKHeaderContent menuIsOpen={isOpened} /></SideMenuHeader>
		<SideMenuContent>
			{#each MENU_ITEMS as item (item.key)}
				{#snippet tooltip()}<ListItem class="atmr-side-menu__item">{item.label}</ListItem>{/snippet}
				{#if isOpened}
					<SideMenuItem prefix={homeIcon} onclick={noop}>{item.label}</SideMenuItem>
				{:else}
					<Popover innerChildren={tooltip} placement="right" pointer={false} trigger="hover" offset={16} popoverClassName="atmr-side-menu__tooltip" useInPortal>
						<SideMenuItem prefix={homeIcon} onclick={noop} />
					</Popover>
				{/if}
			{/each}
		</SideMenuContent>
	</SideMenu>
</div>
