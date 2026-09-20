<script lang="ts">
	// Port of Patterns & Recipes/TopMenu/Two Level Club -> TwoLevelClubStory
	import '../_utils/topMenuCommon.css';
	import './_patterns-recipes-topmenu-twolevelclub--two-level-club-story.css';
	import Button from '$lib/components/Button/Button/Button.svelte';
	import Segment from '$lib/components/SegmentedControl/Segment/Segment.svelte';
	import SegmentedControl from '$lib/components/SegmentedControl/SegmentedControl.svelte';
	import TabsGroup from '$lib/components/Tabs/TabsGroup/TabsGroup.svelte';
	import TabsItem from '$lib/components/Tabs/TabsItem/TabsItem.svelte';
	import TopMenu from '$lib/components/TopMenu/TopMenu.svelte';
	import TopMenuActionsContainer from '$lib/components/TopMenu/TopMenuActionsContainer.svelte';
	import TopMenuBrandContainer from '$lib/components/TopMenu/TopMenuBrandContainer.svelte';
	import TopMenuNavigationContainer from '$lib/components/TopMenu/TopMenuNavigationContainer.svelte';
	import TopMenuProductContainer from '$lib/components/TopMenu/TopMenuProductContainer.svelte';
	import TopMenuProfileContainer from '$lib/components/TopMenu/TopMenuProfileContainer.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import Search from '$lib/icons/24/action/Search.svelte';
	import ChevronDown from '$lib/icons/24/navigation/ChevronDown.svelte';
	import Menu from '$lib/icons/24/navigation/Menu.svelte';

	const TOP_TABS: { label: string; index: string; icon?: boolean; iconPosition?: 'left' | 'right' }[] = [
		{ label: 'Частным клиентам', index: '0' },
		{ label: 'Самозанятым', index: '1' },
		{ label: 'Малому бизнесу и ИП', index: '2' },
		{ label: 'Ещё', index: '3', icon: true, iconPosition: 'right' }
	];

	const SEGMENT_OPTIONS = [
		{ label: 'Для всех', index: '0' },
		{ label: 'Для молодёжи', index: '1' },
		{ label: 'Для семьи', index: '2' },
		{ label: 'Пенсионерам', index: '3' }
	];

	let topTab = $state('0');
	let segment = $state('0');
</script>

{#snippet chevronDown()}<ChevronDown />{/snippet}
{#snippet avatar()}
	<img src="/story-assets/profileAvatarExample.jpg" alt="Профиль" width="36" height="36" class="atmr-top-menu__profile-avatar atmr-top-menu__profile-avatar--soft" />
{/snippet}

<!-- decorator: <div style={{ width: '100vw', height: '100%' }}><Story /></div> -->
<div style="width: 100vw; height: 100%">
	<div class="stories-main-top-menu">
		<div class="stories-main-top-menu__row stories-main-top-menu__primary">
			<div class="top-menu-club__stack">
				<TopMenu class="atmr-top-menu--club-top">
					<TopMenuProductContainer align="center">
						<TabsGroup variant="primary" size="s" value={topTab} onChange={(index) => void (topTab = index)} class="atmr-top-menu__product-tabs" scrollable>
							{#each TOP_TABS as tab (tab.index)}
								<TabsItem label={tab.label} index={tab.index} icon={tab.icon ? chevronDown : undefined} iconPosition={tab.iconPosition} />
							{/each}
						</TabsGroup>
					</TopMenuProductContainer>
				</TopMenu>

				<TopMenu class="atmr-top-menu--club-sub">
					<TopMenuNavigationContainer>
						<div class="atmr-top-menu__navigation-icon"><Menu /></div>
					</TopMenuNavigationContainer>

					<TopMenuBrandContainer>
						<div class="atmr-top-menu__brand">
							<div class="atmr-top-menu__brand-icon-container">
								<img src="/story-assets/RostelecomB2C.svg" alt="Ростелеком клуб" width="28" height="28" />
							</div>
							<Typography variant="body-l" strong>Ростелеком клуб</Typography>
						</div>
					</TopMenuBrandContainer>

					<TopMenuProductContainer align="center">
						<SegmentedControl class="top-menu-club__segmented" value={segment} onChange={(index) => void (segment = index)} variant="secondary" size="m">
							{#each SEGMENT_OPTIONS as item (item.index)}
								<Segment index={item.index} label={item.label} />
							{/each}
						</SegmentedControl>
					</TopMenuProductContainer>

					<TopMenuActionsContainer class="top-menu-club__actions">
						<div class="atmr-top-menu__utilities-icon" aria-label="Поиск"><Search /></div>
						<Button size="m" variant="primary" colorScheme="accent" label="Участвовать" />
					</TopMenuActionsContainer>

					<TopMenuProfileContainer prefix={avatar} />
				</TopMenu>
			</div>
		</div>
	</div>
</div>
