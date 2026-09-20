<script lang="ts">
	// Port of Patterns & Recipes/TopMenu/Two Level -> TwoLevelStory
	import '../_utils/topMenuCommon.css';
	import './_patterns-recipes-topmenu-twolevel--two-level-story.css';
	import type { Component } from 'svelte';
	import Breadcrumbs from '$lib/components/Breadcrumbs/Breadcrumbs.svelte';
	import Button from '$lib/components/Button/Button/Button.svelte';
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
	import Home from '$lib/icons/24/action/Home.svelte';
	import NotificationNew from '$lib/icons/24/action/NotificationNew.svelte';
	import Search from '$lib/icons/24/action/Search.svelte';
	import HelpStroke from '$lib/icons/24/alert/HelpStroke.svelte';
	import Chat from '$lib/icons/24/communication/Chat.svelte';
	import ChevronDown from '$lib/icons/24/navigation/ChevronDown.svelte';

	const PRODUCT_TABS: { label: string; index: string; icon?: boolean; iconPosition?: 'left' | 'right' }[] = [
		{ label: 'Овервью', index: '0' },
		{ label: 'Чековая книжка', index: '1' },
		{ label: 'Фискализация', index: '2' },
		{ label: 'Онлайн-кассы', index: '3' },
		{ label: 'Ещё', index: '4', icon: true, iconPosition: 'right' }
	];

	const UTILITIES_ICONS: { icon: Component<any>; ariaLabel: string }[] = [
		{ icon: NotificationNew, ariaLabel: 'Уведомления' },
		{ icon: HelpStroke, ariaLabel: 'Помощь' },
		{ icon: Chat, ariaLabel: 'Чат' }
	];

	let tabValue = $state('0');
</script>

{#snippet chevronDown()}<ChevronDown />{/snippet}
{#snippet crumb1()}<a href="#home">МРФ Центр</a>{/snippet}
{#snippet crumb2()}<a href="#organization">ООО «Рога и копыта»</a>{/snippet}
{#snippet crumb3()}<a href="#task">Задание 10234322</a>{/snippet}
{#snippet avatar()}
	<img src="/story-assets/profileAvatarExample.jpg" alt="woman" width="36" height="36" class="atmr-top-menu__profile-avatar atmr-top-menu__profile-avatar--round" />
{/snippet}

<!-- decorator: <div style={{ width: '100vw', height: '100%' }}><Story /></div> -->
<div style="width: 100vw; height: 100%">
	<div class="stories-main-top-menu">
		<div class="stories-main-top-menu__row stories-main-top-menu__primary">
			<div class="top-menu-two-level__stack">
				<TopMenu class="atmr-top-menu--two-level-top">
					<TopMenuBrandContainer>
						<div class="atmr-top-menu__brand">
							<div class="atmr-top-menu__brand-icon-container">
								<img src="/story-assets/RostelecomB2C.svg" alt="Ростелеком" width="28" height="28" />
							</div>
							<Typography variant="body-l" strong>Ростелеком чек</Typography>
						</div>
					</TopMenuBrandContainer>

					<TopMenuProductContainer align="left">
						<TabsGroup variant="primary" size="s" value={tabValue} onChange={(index) => void (tabValue = index)} class="atmr-top-menu__product-tabs" scrollable>
							{#each PRODUCT_TABS as tab (tab.index)}
								<TabsItem label={tab.label} index={tab.index} icon={tab.icon ? chevronDown : undefined} iconPosition={tab.iconPosition} />
							{/each}
						</TabsGroup>
					</TopMenuProductContainer>

					<TopMenuActionsContainer>
						<div class="atmr-top-menu__utilities-icon" aria-label="Поиск"><Search /></div>
					</TopMenuActionsContainer>

					<TopMenuUtilitiesContainer>
						{#each UTILITIES_ICONS as item (item.ariaLabel)}
							<div class="atmr-top-menu__utilities-icon" aria-label={item.ariaLabel}><item.icon /></div>
						{/each}
					</TopMenuUtilitiesContainer>

					<TopMenuProfileContainer prefix={avatar} title="Анна Кузнецова" hint="Администратор" />
				</TopMenu>

				<TopMenu class="atmr-top-menu--two-level-sub">
					<TopMenuNavigationContainer>
						<div class="top-menu-two-level__nav-row">
							<button type="button" class="top-menu-two-level__home-icon" aria-label="Главная"><Home /></button>
							<div class="top-menu-two-level__breadcrumbs">
								<Breadcrumbs size="s" variant="primary" children={[crumb1, crumb2, crumb3]} />
							</div>
						</div>
					</TopMenuNavigationContainer>

					<TopMenuActionsContainer>
						<Button size="m" variant="secondary" colorScheme="accent" label="Запустить в работу" />
						<Button size="m" variant="primary" colorScheme="accent" label="Новое задание" />
					</TopMenuActionsContainer>
				</TopMenu>
			</div>
		</div>
	</div>
</div>
