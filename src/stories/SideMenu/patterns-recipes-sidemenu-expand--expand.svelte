<script lang="ts">
	// Port of Patterns & Recipes/SideMenu/Expand -> Expand
	import './_patterns-recipes-sidemenu-expand--expand.css';
	import SideMenu from '$lib/components/SideMenu/SideMenu.svelte';
	import SideMenuContent from '$lib/components/SideMenu/SideMenuContent.svelte';
	import SideMenuExpand from '$lib/components/SideMenu/SideMenuExpand.svelte';
	import SideMenuExpandContent from '$lib/components/SideMenu/SideMenuExpandContent.svelte';
	import SideMenuFooter from '$lib/components/SideMenu/SideMenuFooter.svelte';
	import SideMenuHeader from '$lib/components/SideMenu/SideMenuHeader.svelte';
	import SideMenuHideButton from '$lib/components/SideMenu/SideMenuHideButton.svelte';
	import SideMenuItem from '$lib/components/SideMenu/SideMenuItem.svelte';
	import Home from '$lib/icons/24/action/Home.svelte';
	import { noop } from '$lib/utils/noop.js';
	import RTKHeaderContent from './_RTKHeaderContent.svelte';

	const BASE_COUNT = 5;
	const EXTRA_COUNT = 15;

	const createMenuItems = (length: number, start = 0) => Array.from({ length }, (_, i) => ({ key: `item-${start + i}`, label: `Item text` }));

	let menuIsOpen = $state(true);
	let menuIsExpanded = $state(false);

	const baseItems = createMenuItems(BASE_COUNT);
	const extraItems = createMenuItems(EXTRA_COUNT, BASE_COUNT);
</script>

{#snippet homeIcon()}<Home />{/snippet}

<div class="stories-main-side-menu">
	<SideMenu isOpened={menuIsOpen}>
		<SideMenuHeader><RTKHeaderContent {menuIsOpen} /></SideMenuHeader>
		<SideMenuContent class="atmr-scroll-bar">
			{#each baseItems as item (item.key)}
				<SideMenuItem prefix={homeIcon} onclick={noop}>{item.label}</SideMenuItem>
			{/each}

			<SideMenuExpandContent isOpened={menuIsExpanded}>
				{#each extraItems as item (item.key)}
					<SideMenuItem prefix={homeIcon} onclick={noop}>{item.label}</SideMenuItem>
				{/each}
			</SideMenuExpandContent>

			<SideMenuExpand isOpened={menuIsExpanded} onclick={() => (menuIsExpanded = !menuIsExpanded)} />
		</SideMenuContent>

		<SideMenuFooter>
			<SideMenuHideButton onclick={() => (menuIsOpen = !menuIsOpen)} />
		</SideMenuFooter>
	</SideMenu>
</div>
