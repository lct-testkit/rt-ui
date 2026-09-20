<script lang="ts">
	// Port of Patterns & Recipes/SideMenu/Side With Top Menu -> SideWithTopMenuStory
	// (decorator: a <style> that makes #storybook-root full height -> ../_utils/storybookRootFullHeight.css)
	import '../_utils/topMenuCommon.css';
	import '../_utils/storybookRootFullHeight.css';
	import './_patterns-recipes-sidemenu-sidewithtopmenu--side-with-top-menu-story.css';
	import Badge from '$lib/components/Badge/Badge.svelte';
	import Button from '$lib/components/Button/Button/Button.svelte';
	import FunctionButton from '$lib/components/Button/FunctionButton/FunctionButton.svelte';
	import SideMenu from '$lib/components/SideMenu/SideMenu.svelte';
	import SideMenuContent from '$lib/components/SideMenu/SideMenuContent.svelte';
	import SideMenuFooter from '$lib/components/SideMenu/SideMenuFooter.svelte';
	import SideMenuHeader from '$lib/components/SideMenu/SideMenuHeader.svelte';
	import SideMenuHideButton from '$lib/components/SideMenu/SideMenuHideButton.svelte';
	import SideMenuInfoBlock from '$lib/components/SideMenu/SideMenuInfoBlock.svelte';
	import SideMenuItem from '$lib/components/SideMenu/SideMenuItem.svelte';
	import TopMenu from '$lib/components/TopMenu/TopMenu.svelte';
	import TopMenuActionsContainer from '$lib/components/TopMenu/TopMenuActionsContainer.svelte';
	import TopMenuProductContainer from '$lib/components/TopMenu/TopMenuProductContainer.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import Home from '$lib/icons/24/action/Home.svelte';
	import Search from '$lib/icons/24/action/Search.svelte';
	import MenuKebab from '$lib/icons/24/navigation/MenuKebab.svelte';
	import Heart from '$lib/icons/24/rating/Heart.svelte';
	import HeartFill from '$lib/icons/24/rating/HeartFill.svelte';
	import RTKHeaderContent from '../SideMenu/_RTKHeaderContent.svelte';

	const SIDE_MENU_ITEMS = Array.from({ length: 5 }, () => `Item text`);

	let menuIsOpen = $state(true);
	let heartFilled = $state(false);
</script>

{#snippet homeIcon()}<Home />{/snippet}
{#snippet kebab()}<MenuKebab size={24} />{/snippet}

<div class="stories-side-with-top-menu">
	<div class="stories-side-with-top-menu__layout">
		<div class="stories-main-side-menu">
			<SideMenu isOpened={menuIsOpen}>
				<SideMenuHeader>
					<RTKHeaderContent {menuIsOpen} header="Header" subHeader="Subheader" />
				</SideMenuHeader>

				<SideMenuContent class="atmr-scroll-bar">
					{#each SIDE_MENU_ITEMS as item, index (index)}
						<SideMenuItem prefix={homeIcon}>{item}</SideMenuItem>
					{/each}
				</SideMenuContent>

				<SideMenuFooter>
					<SideMenuHideButton onclick={() => (menuIsOpen = !menuIsOpen)} />
					<SideMenuInfoBlock title="Версия Front/Back: 1.13.0 beta" shortenedTitle="1.13.0 beta" />
				</SideMenuFooter>
			</SideMenu>
		</div>

		<div class="stories-side-with-top-menu__main">
			<TopMenu class="atmr-top-menu--page-title-status">
				<TopMenuProductContainer align="left">
					<div class="top-menu-page-title-status__content">
						<button
							type="button"
							class={heartFilled
								? 'side-with-top-menu__page-title-heart side-with-top-menu__page-title-heart--filled'
								: 'side-with-top-menu__page-title-heart'}
							aria-pressed={heartFilled ? 'true' : 'false'}
							aria-label={heartFilled ? 'Убрать из избранного' : 'Добавить в избранное'}
							onclick={() => (heartFilled = !heartFilled)}
						>
							{#if heartFilled}<HeartFill />{:else}<Heart />{/if}
						</button>
						<Typography variant="heading-h3">Page Title</Typography>
						<FunctionButton icon={kebab} variant="secondary" size="s" aria-label="Открыть меню" />

						<Badge label="Status text" size="s" variant="secondary" colorScheme="info" class="top-menu-page-title-status__badge" dot />
					</div>
				</TopMenuProductContainer>

				<TopMenuActionsContainer>
					<div class="atmr-top-menu__utilities-icon" aria-label="Поиск"><Search /></div>
					<Button class="top-menu-page-title-status__action-button" size="m" variant="secondary" colorScheme="accent" label="Button label" />
				</TopMenuActionsContainer>
			</TopMenu>

			<div class="stories-side-with-top-menu__content"></div>
		</div>
	</div>
</div>
