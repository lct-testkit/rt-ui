<script lang="ts">
	// Port of Patterns & Recipes/SideMenu/SideMenu -> SideMenuStory (`SideMenuExample`)
	import './_patterns-recipes-sidemenu-sidemenu--side-menu-story.css';
	import Badge from '$lib/components/Badge/Badge.svelte';
	import SideMenu from '$lib/components/SideMenu/SideMenu.svelte';
	import SideMenuContent from '$lib/components/SideMenu/SideMenuContent.svelte';
	import SideMenuFooter from '$lib/components/SideMenu/SideMenuFooter.svelte';
	import SideMenuHeader from '$lib/components/SideMenu/SideMenuHeader.svelte';
	import SideMenuHideButton from '$lib/components/SideMenu/SideMenuHideButton.svelte';
	import SideMenuItem from '$lib/components/SideMenu/SideMenuItem.svelte';
	import SideMenuSearch from '$lib/components/SideMenu/SideMenuSearch.svelte';
	import SideMenuUtilityProfile from '$lib/components/SideMenu/SideMenuUtilityProfile.svelte';
	import SideMenuUtilitySupport from '$lib/components/SideMenu/SideMenuUtilitySupport.svelte';
	import Switch from '$lib/components/Switch/Switch.svelte';
	import HelpStroke from '$lib/icons/24/alert/HelpStroke.svelte';
	import NotificationNew from '$lib/icons/24/action/NotificationNew.svelte';
	import Search from '$lib/icons/24/action/Search.svelte';
	import Chat from '$lib/icons/24/communication/Chat.svelte';
	import MenuKebab from '$lib/icons/24/navigation/MenuKebab.svelte';
	import SignOut from '$lib/icons/24/navigation/SignOut.svelte';
	import DarkTheme from '$lib/icons/24/place/DarkTheme.svelte';
	import MenuContent from './_MenuContent.svelte';
	import RTKHeaderContent from './_RTKHeaderContent.svelte';
	import SearchInput from './_SearchInput.svelte';

	let menuIsOpen = $state(true);
</script>

{#snippet notificationIcon()}<NotificationNew />{/snippet}
{#snippet notificationBadge()}<Badge label="+23" variant="primary" colorScheme="error" size="s" />{/snippet}
{#snippet helpIcon()}<HelpStroke />{/snippet}
{#snippet kebabIcon()}<MenuKebab />{/snippet}
{#snippet darkThemeIcon()}<DarkTheme />{/snippet}
{#snippet nightSwitch()}<Switch size="s" />{/snippet}
{#snippet chatIcon()}<Chat />{/snippet}
{#snippet avatar()}<img src="/story-assets/profileAvatarExample.jpg" alt="woman" width="36" height="36" class="atmr-side-menu__profile-avatar" />{/snippet}
{#snippet signOutIcon()}<SignOut class="item--hover" />{/snippet}

<div class="stories-main-side-menu">
	<SideMenu isOpened={menuIsOpen}>
		<SideMenuHeader><RTKHeaderContent {menuIsOpen} /></SideMenuHeader>
		<SideMenuSearch>
			{#if menuIsOpen}<SearchInput />{:else}<Search />{/if}
		</SideMenuSearch>

		<SideMenuContent class="atmr-scroll-bar">
			<MenuContent {menuIsOpen} />
		</SideMenuContent>

		<SideMenuFooter>
			<SideMenuItem prefix={notificationIcon} suffix={notificationBadge} class="footer__notification">Уведомления</SideMenuItem>
			<SideMenuItem prefix={helpIcon} suffix={kebabIcon} class="footer__notification">Руководство</SideMenuItem>
			<SideMenuItem prefix={darkThemeIcon} suffix={nightSwitch}>Ночной режим</SideMenuItem>

			<SideMenuUtilitySupport prefix={chatIcon} title="info@support.ru" hint="Служба поддержки" />

			<SideMenuUtilityProfile prefix={avatar} suffix={signOutIcon} title="Анна Кузнецова" hint="Администратор" class="item--hover-profile" />
		</SideMenuFooter>

		<SideMenuFooter>
			<SideMenuHideButton onclick={() => (menuIsOpen = !menuIsOpen)} />
		</SideMenuFooter>
	</SideMenu>
</div>
