<script lang="ts">
	// Port of Patterns & Recipes/TopMenu/Two Level Site -> TwoLevelSiteStory
	import '../_utils/topMenuCommon.css';
	import './_patterns-recipes-topmenu-twolevelsite--two-level-site-story.css';
	import Button from '$lib/components/Button/Button/Button.svelte';
	import FunctionButton from '$lib/components/Button/FunctionButton/FunctionButton.svelte';
	import TabsGroup from '$lib/components/Tabs/TabsGroup/TabsGroup.svelte';
	import TabsItem from '$lib/components/Tabs/TabsItem/TabsItem.svelte';
	import TopMenu from '$lib/components/TopMenu/TopMenu.svelte';
	import TopMenuActionsContainer from '$lib/components/TopMenu/TopMenuActionsContainer.svelte';
	import TopMenuBrandContainer from '$lib/components/TopMenu/TopMenuBrandContainer.svelte';
	import TopMenuProductContainer from '$lib/components/TopMenu/TopMenuProductContainer.svelte';
	import TopMenuUtilitiesContainer from '$lib/components/TopMenu/TopMenuUtilitiesContainer.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import Search from '$lib/icons/24/action/Search.svelte';
	import Headphones from '$lib/icons/24/media/Headphones.svelte';
	import ChevronDown from '$lib/icons/24/navigation/ChevronDown.svelte';
	import Pin from '$lib/icons/24/navigation/Pin.svelte';

	const TOP_TABS: { label: string; index: string; icon?: boolean; iconPosition?: 'left' | 'right' }[] = [
		{ label: 'Для меня', index: '0' },
		{ label: 'Для бизнеса', index: '1' },
		{ label: 'Операторам', index: '2' },
		{ label: 'Блог', index: '3' },
		{ label: 'Ещё', index: '4', icon: true, iconPosition: 'right' }
	];

	const BOTTOM_TABS = [
		{ label: 'Домашний интернет', index: '0' },
		{ label: 'Мобильный интернет', index: '1' },
		{ label: 'Видеонаблюдение', index: '2' }
	];

	let topTab = $state('0');
	let bottomTab = $state('0');
</script>

{#snippet chevronDown()}<ChevronDown />{/snippet}
{#snippet pin()}<Pin />{/snippet}
{#snippet headphones()}<Headphones />{/snippet}

<!-- decorator: <div style={{ width: '100vw', height: '100%' }}><Story /></div> -->
<div style="width: 100vw; height: 100%">
	<div class="stories-main-top-menu">
		<div class="stories-main-top-menu__row stories-main-top-menu__primary">
			<div class="top-menu-site__stack">
				<TopMenu class="atmr-top-menu--site-top">
					<TopMenuProductContainer align="left">
						<TabsGroup variant="primary" size="s" value={topTab} onChange={(index) => void (topTab = index)} class="atmr-top-menu__product-tabs" scrollable>
							{#each TOP_TABS as tab (tab.index)}
								<TabsItem label={tab.label} index={tab.index} icon={tab.icon ? chevronDown : undefined} iconPosition={tab.iconPosition} />
							{/each}
						</TabsGroup>
					</TopMenuProductContainer>

					<TopMenuUtilitiesContainer class="top-menu-site__function-buttons">
						<FunctionButton variant="tertiary" icon={pin} iconPosition="left" label="Москва и Московская область" />
						<FunctionButton variant="tertiary" icon={headphones} iconPosition="left" label="Поддержка" />
					</TopMenuUtilitiesContainer>
				</TopMenu>

				<TopMenu class="atmr-top-menu--site-sub">
					<TopMenuBrandContainer>
						<div class="atmr-top-menu__brand">
							<div class="atmr-top-menu__brand-icon-container">
								<img src="/story-assets/RostelecomB2C.svg" alt="Ростелеком" width="28" height="28" />
							</div>
							<Typography variant="body-l" strong>Ростелеком</Typography>
						</div>
					</TopMenuBrandContainer>

					<TopMenuProductContainer align="left">
						<TabsGroup variant="primary" size="m" value={bottomTab} onChange={(index) => void (bottomTab = index)} class="atmr-top-menu__product-tabs" scrollable>
							{#each BOTTOM_TABS as tab (tab.index)}
								<TabsItem label={tab.label} index={tab.index} icon={chevronDown} iconPosition="right" />
							{/each}
						</TabsGroup>
					</TopMenuProductContainer>

					<TopMenuActionsContainer>
						<div class="atmr-top-menu__utilities-icon" aria-label="Поиск"><Search /></div>
					</TopMenuActionsContainer>

					<TopMenuUtilitiesContainer class="top-menu-site__auth-buttons">
						<Button size="m" variant="secondary" colorScheme="accent" label="Войти" />
						<Button size="m" variant="primary" colorScheme="accent" label="Создать аккаунт" />
					</TopMenuUtilitiesContainer>
				</TopMenu>
			</div>
		</div>
	</div>
</div>
