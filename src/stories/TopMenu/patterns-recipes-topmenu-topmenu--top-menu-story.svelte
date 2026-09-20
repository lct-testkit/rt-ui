<script lang="ts">
	// Port of Patterns & Recipes/TopMenu/TopMenu -> TopMenuStory (`TopMenuExample(args)`)
	import '../_utils/topMenuCommon.css';
	import './_patterns-recipes-topmenu-topmenu--top-menu-story.css';
	import Button from '$lib/components/Button/Button/Button.svelte';
	import FunctionButton from '$lib/components/Button/FunctionButton/FunctionButton.svelte';
	import TabsGroup from '$lib/components/Tabs/TabsGroup/TabsGroup.svelte';
	import TabsItem from '$lib/components/Tabs/TabsItem/TabsItem.svelte';
	import TopMenu from '$lib/components/TopMenu/TopMenu.svelte';
	import TopMenuActionsContainer from '$lib/components/TopMenu/TopMenuActionsContainer.svelte';
	import TopMenuBrandContainer from '$lib/components/TopMenu/TopMenuBrandContainer.svelte';
	import TopMenuNavigationContainer from '$lib/components/TopMenu/TopMenuNavigationContainer.svelte';
	import TopMenuProductContainer from '$lib/components/TopMenu/TopMenuProductContainer.svelte';
	import TopMenuProfileContainer from '$lib/components/TopMenu/TopMenuProfileContainer.svelte';
	import TopMenuUtilitiesContainer from '$lib/components/TopMenu/TopMenuUtilitiesContainer.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import NotificationNew from '$lib/icons/24/action/NotificationNew.svelte';
	import Search from '$lib/icons/24/action/Search.svelte';
	import HelpStroke from '$lib/icons/24/alert/HelpStroke.svelte';
	import Chat from '$lib/icons/24/communication/Chat.svelte';
	import Glasses from '$lib/icons/24/culture/Glasses.svelte';
	import ChevronDown from '$lib/icons/24/navigation/ChevronDown.svelte';
	import Menu from '$lib/icons/24/navigation/Menu.svelte';

	// storybook args (initialArgs of the story)
	let {
		align = 'left',
		header = 'Header',
		subHeader = 'Subheader',
		showIcon = true,
		navigationContainer = true,
		utilitiesContainerLeft = false,
		productContainer = true,
		actionsContainer = true,
		utilitiesContainer = true,
		profileContainer = true
	}: {
		align?: 'left' | 'center' | 'right' | 'stretch';
		header?: string;
		subHeader?: string;
		showIcon?: boolean;
		navigationContainer?: boolean;
		utilitiesContainerLeft?: boolean;
		productContainer?: boolean;
		actionsContainer?: boolean;
		utilitiesContainer?: boolean;
		profileContainer?: boolean;
	} = $props();

	const PRODUCT_TABS = [
		{ label: 'Label', index: '0' },
		{ label: 'Label', index: '1' },
		{ label: 'Label', index: '2' },
		{ label: 'Label', index: '3' },
		{ label: 'Label', index: '4' }
	];

	let tabValue = $state('0');
</script>

{#snippet chevronDown()}<ChevronDown />{/snippet}
{#snippet avatar()}
	<img src="/story-assets/profileAvatarExample.jpg" alt="woman" width="36" height="36" class="atmr-top-menu__profile-avatar atmr-top-menu__profile-avatar--round" />
{/snippet}

<!-- decorator: <div style={{ width: '100vw', height: '100%' }}><Story /></div> -->
<div style="width: 100vw; height: 100%">
	<div class="stories-main-top-menu">
		<div class="stories-main-top-menu__row stories-main-top-menu__primary">
			<TopMenu class="atmr-top-menu--story-base">
				{#if navigationContainer}
					<TopMenuNavigationContainer>
						<div class="atmr-top-menu__navigation-icon"><Menu /></div>
					</TopMenuNavigationContainer>
				{/if}

				<TopMenuBrandContainer>
					<div class="atmr-top-menu__brand">
						<div class="atmr-top-menu__brand-icon-container">
							<img src="/story-assets/RostelecomB2C.svg" alt="Rostelecom B2C" width="28" height="28" />
						</div>

						{#if header || subHeader || showIcon}
							<div class="atmr-top-menu__brand-text">
								{#if header || showIcon}
									<FunctionButton
										size="s"
										variant="secondary"
										class="atmr-top-menu__brand-function-button"
										label={header}
										icon={showIcon ? chevronDown : null}
										iconPosition="right"
									/>
								{/if}

								{#if subHeader}
									<Typography variant="description-l" class="atmr-top-menu__brand-sub-header">{subHeader}</Typography>
								{/if}
							</div>
						{/if}
					</div>
				</TopMenuBrandContainer>

				{#if utilitiesContainerLeft}
					<TopMenuUtilitiesContainer>
						<div class="atmr-top-menu__utilities-icon"><Glasses /></div>
					</TopMenuUtilitiesContainer>
				{/if}

				{#if productContainer}
					<TopMenuProductContainer {align}>
						<TabsGroup variant="primary" size="s" value={tabValue} onChange={(index) => void (tabValue = index)} class="atmr-top-menu__product-tabs">
							{#each PRODUCT_TABS as tab (tab.index)}
								<TabsItem label={tab.label} index={tab.index} />
							{/each}
						</TabsGroup>
					</TopMenuProductContainer>
				{:else}
					<TopMenuProductContainer {align} style={{ height: 56 }} />
				{/if}

				{#if actionsContainer}
					<TopMenuActionsContainer>
						<div class="atmr-top-menu__utilities-icon" aria-label="Поиск"><Search /></div>
						<Button size="m" variant="secondary" colorScheme="accent" label="Button label" />
					</TopMenuActionsContainer>
				{/if}

				{#if utilitiesContainer}
					<TopMenuUtilitiesContainer>
						<div class="atmr-top-menu__utilities-icon"><NotificationNew /></div>
						<div class="atmr-top-menu__utilities-icon"><HelpStroke /></div>
						<div class="atmr-top-menu__utilities-icon"><Chat /></div>
					</TopMenuUtilitiesContainer>
				{/if}

				{#if profileContainer}
					<TopMenuProfileContainer prefix={avatar} />
				{/if}
			</TopMenu>
		</div>
	</div>
</div>
