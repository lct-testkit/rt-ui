<script lang="ts">
	// Port of Patterns & Recipes/SideMenu/InfoBlock -> InfoBlock
	import './_patterns-recipes-sidemenu-infoblock--info-block.css';
	import SideMenu from '$lib/components/SideMenu/SideMenu.svelte';
	import SideMenuContent from '$lib/components/SideMenu/SideMenuContent.svelte';
	import SideMenuFooter from '$lib/components/SideMenu/SideMenuFooter.svelte';
	import SideMenuHeader from '$lib/components/SideMenu/SideMenuHeader.svelte';
	import SideMenuHideButton from '$lib/components/SideMenu/SideMenuHideButton.svelte';
	import SideMenuInfoBlock from '$lib/components/SideMenu/SideMenuInfoBlock.svelte';
	import SideMenuItem from '$lib/components/SideMenu/SideMenuItem.svelte';
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
			{#each Array.from({ length: 5 }) as _, index (index)}
				<SideMenuItem prefix={homeIcon} onclick={noop}>Item text</SideMenuItem>
			{/each}
		</SideMenuContent>
		<SideMenuFooter>
			<SideMenuHideButton onclick={() => (menuIsOpen = !menuIsOpen)} />
			<SideMenuInfoBlock title="Версия Front/Back: 1.13.0 beta" shortenedTitle="1.13.0 beta" />
		</SideMenuFooter>
	</SideMenu>
</div>
