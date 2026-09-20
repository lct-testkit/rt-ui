<script lang="ts">
	// Port of Patterns & Recipes/TopMenu/Top With Side Menu -> TopWithSideMenuStory
	// (decorator: a <style> that makes #storybook-root full height -> ../_utils/storybookRootFullHeight.css)
	import '../_utils/topMenuCommon.css';
	import '../_utils/storybookRootFullHeight.css';
	import './_patterns-recipes-topmenu-topwithsidemenu--top-with-side-menu-story.css';
	import SideMenu from '$lib/components/SideMenu/SideMenu.svelte';
	import SideMenuContent from '$lib/components/SideMenu/SideMenuContent.svelte';
	import SideMenuFooter from '$lib/components/SideMenu/SideMenuFooter.svelte';
	import SideMenuHideButton from '$lib/components/SideMenu/SideMenuHideButton.svelte';
	import SideMenuInfoBlock from '$lib/components/SideMenu/SideMenuInfoBlock.svelte';
	import SideMenuItem from '$lib/components/SideMenu/SideMenuItem.svelte';
	import TabsGroup from '$lib/components/Tabs/TabsGroup/TabsGroup.svelte';
	import TabsItem from '$lib/components/Tabs/TabsItem/TabsItem.svelte';
	import TopMenu from '$lib/components/TopMenu/TopMenu.svelte';
	import TopMenuBrandContainer from '$lib/components/TopMenu/TopMenuBrandContainer.svelte';
	import TopMenuNavigationContainer from '$lib/components/TopMenu/TopMenuNavigationContainer.svelte';
	import TopMenuProductContainer from '$lib/components/TopMenu/TopMenuProductContainer.svelte';
	import TopMenuProfileContainer from '$lib/components/TopMenu/TopMenuProfileContainer.svelte';
	import TopMenuUtilitiesContainer from '$lib/components/TopMenu/TopMenuUtilitiesContainer.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import Home from '$lib/icons/24/action/Home.svelte';
	import NotificationNew from '$lib/icons/24/action/NotificationNew.svelte';
	import HelpStroke from '$lib/icons/24/alert/HelpStroke.svelte';
	import Chat from '$lib/icons/24/communication/Chat.svelte';
	import Menu from '$lib/icons/24/navigation/Menu.svelte';

	const PRODUCT_TABS = Array.from({ length: 5 }, (_, idx) => ({ label: 'Label', index: `${idx}` }));
	const SIDE_MENU_ITEMS = Array.from({ length: 12 }, (_, idx) => `Раздел ${idx + 1}`);

	let tabValue = $state('0');
	let menuIsOpen = $state(false);
</script>

{#snippet homeIcon()}<Home />{/snippet}
{#snippet avatar()}
	<img src="/story-assets/profileAvatarExample.jpg" alt="woman" width="36" height="36" class="atmr-top-menu__profile-avatar atmr-top-menu__profile-avatar--round" />
{/snippet}

<div class="stories-top-with-side-menu">
	<TopMenu class="atmr-top-menu--top-with-side-menu">
		<TopMenuNavigationContainer>
			<div class="atmr-top-menu__navigation-icon"><Menu /></div>
		</TopMenuNavigationContainer>

		<TopMenuBrandContainer>
			<div class="atmr-top-menu__brand">
				<div class="atmr-top-menu__brand-icon-container">
					<img src="/story-assets/RostelecomB2C.svg" alt="Rostelecom B2C" width="28" height="28" />
				</div>
				<Typography variant="body-l" strong>Header</Typography>
			</div>
		</TopMenuBrandContainer>

		<TopMenuProductContainer align="left">
			<TabsGroup variant="primary" size="s" value={tabValue} onChange={(index) => void (tabValue = index)} class="atmr-top-menu__product-tabs">
				{#each PRODUCT_TABS as tab (tab.index)}
					<TabsItem label={tab.label} index={tab.index} />
				{/each}
			</TabsGroup>
		</TopMenuProductContainer>

		<TopMenuUtilitiesContainer>
			<div class="atmr-top-menu__utilities-icon"><NotificationNew /></div>
			<div class="atmr-top-menu__utilities-icon"><HelpStroke /></div>
			<div class="atmr-top-menu__utilities-icon"><Chat /></div>
		</TopMenuUtilitiesContainer>

		<TopMenuProfileContainer prefix={avatar} />
	</TopMenu>

	<div class="stories-top-with-side-menu__layout">
		<div class="stories-main-side-menu">
			<SideMenu isOpened={menuIsOpen}>
				<SideMenuContent class="atmr-scroll-bar">
					{#each SIDE_MENU_ITEMS as item (item)}
						<SideMenuItem prefix={homeIcon}>{item}</SideMenuItem>
					{/each}
				</SideMenuContent>

				<SideMenuFooter>
					<SideMenuHideButton onclick={() => (menuIsOpen = !menuIsOpen)} />
					<SideMenuInfoBlock title="Версия Front/Back: 1.13.0 beta" shortenedTitle="1.13.0 beta" />
				</SideMenuFooter>
			</SideMenu>
		</div>

		<div class="stories-top-with-side-menu__content"></div>
	</div>
</div>
