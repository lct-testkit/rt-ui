<script lang="ts">
	// Port of Patterns & Recipes/SideMenu/Categories -> Categories
	import './_patterns-recipes-sidemenu-categories--categories.css';
	import SideMenu from '$lib/components/SideMenu/SideMenu.svelte';
	import SideMenuContent from '$lib/components/SideMenu/SideMenuContent.svelte';
	import SideMenuFooter from '$lib/components/SideMenu/SideMenuFooter.svelte';
	import SideMenuHeader from '$lib/components/SideMenu/SideMenuHeader.svelte';
	import SideMenuHideButton from '$lib/components/SideMenu/SideMenuHideButton.svelte';
	import SideMenuItem from '$lib/components/SideMenu/SideMenuItem.svelte';
	import SideMenuTitle from '$lib/components/SideMenu/SideMenuTitle.svelte';
	import Home from '$lib/icons/24/action/Home.svelte';
	import { noop } from '$lib/utils/noop.js';
	import RTKHeaderContent from './_RTKHeaderContent.svelte';

	let menuIsOpen = $state(true);
</script>

{#snippet homeIcon()}<Home />{/snippet}

<div class="stories-main-side-menu">
	<SideMenu isOpened={menuIsOpen}>
		<SideMenuHeader><RTKHeaderContent {menuIsOpen} /></SideMenuHeader>

		<SideMenuContent class="atmr-scroll-bar">
			<SideMenuTitle>Title</SideMenuTitle>
			{#each Array.from({ length: 5 }) as _, index (index)}
				<SideMenuItem prefix={homeIcon} onclick={noop}>Item text</SideMenuItem>
			{/each}

			<SideMenuTitle>Title</SideMenuTitle>
			{#each Array.from({ length: 5 }) as _, index (index)}
				<SideMenuItem prefix={homeIcon} onclick={noop}>Item text</SideMenuItem>
			{/each}
		</SideMenuContent>

		<SideMenuFooter>
			<SideMenuHideButton onclick={() => (menuIsOpen = !menuIsOpen)} />
		</SideMenuFooter>
	</SideMenu>
</div>
