<script lang="ts">
	// S5: the permanent part of a screen - side menu, top menu, breadcrumbs, tabs.
	import SideMenu from '@rt-ui/components/SideMenu/SideMenu.svelte';
	import SideMenuHeader from '@rt-ui/components/SideMenu/SideMenuHeader.svelte';
	import SideMenuContent from '@rt-ui/components/SideMenu/SideMenuContent.svelte';
	import SideMenuItem from '@rt-ui/components/SideMenu/SideMenuItem.svelte';
	import SideMenuFooter from '@rt-ui/components/SideMenu/SideMenuFooter.svelte';
	import SideMenuHideButton from '@rt-ui/components/SideMenu/SideMenuHideButton.svelte';
	import TopMenu from '@rt-ui/components/TopMenu/TopMenu.svelte';
	import TopMenuFlow from '@rt-ui/components/TopMenu/TopMenuFlow.svelte';
	import TopMenuBrandContainer from '@rt-ui/components/TopMenu/TopMenuBrandContainer.svelte';
	import TopMenuUtilitiesContainer from '@rt-ui/components/TopMenu/TopMenuUtilitiesContainer.svelte';
	import Breadcrumbs from '@rt-ui/components/Breadcrumbs/Breadcrumbs.svelte';
	import TabsGroup from '@rt-ui/components/Tabs/TabsGroup/TabsGroup.svelte';
	import TabsItem from '@rt-ui/components/Tabs/TabsItem/TabsItem.svelte';
	import Typography from '@rt-ui/components/Typography/Typography.svelte';
	import Home from '@rt-ui/icons/24/action/Home.svelte';

	const ITEMS = ['Клиенты', 'Сделки', 'Задачи', 'Отчёты', 'Документы', 'Настройки'];
	let menuOpen = $state(true);
	let selected = $state('Клиенты');
	let tab = $state('0');
</script>

{#snippet homeIcon()}<Home />{/snippet}
{#snippet crumb1()}<a href="#crm">CRM</a>{/snippet}
{#snippet crumb2()}<a href="#clients">Клиенты</a>{/snippet}
{#snippet crumb3()}<a href="#card">Карточка клиента</a>{/snippet}

<div style="display:flex;flex-direction:column;height:100vh">
	<TopMenu>
		<TopMenuFlow left>
			<TopMenuBrandContainer><Typography variant="body-l" strong>LCT CRM</Typography></TopMenuBrandContainer>
		</TopMenuFlow>
		<TopMenuFlow right>
			<TopMenuUtilitiesContainer><Typography variant="body-m">Иванов И.</Typography></TopMenuUtilitiesContainer>
		</TopMenuFlow>
	</TopMenu>
	<div style="display:flex;flex:1;min-height:0">
		<SideMenu isOpened={menuOpen}>
			<SideMenuHeader><Typography variant="body-s" strong>Меню</Typography></SideMenuHeader>
			<SideMenuContent>
				{#each ITEMS as item (item)}
					<SideMenuItem prefix={homeIcon} selected={item === selected} onclick={() => (selected = item)}>{item}</SideMenuItem>
				{/each}
			</SideMenuContent>
			<SideMenuFooter><SideMenuHideButton onclick={() => (menuOpen = !menuOpen)} /></SideMenuFooter>
		</SideMenu>
		<main style="flex:1;padding:16px;display:flex;flex-direction:column;gap:16px">
			<Breadcrumbs size="s" children={[crumb1, crumb2, crumb3]} />
			<TabsGroup value={tab} onChange={(v: string) => (tab = v)}>
				<TabsItem label="Обзор" index="0" />
				<TabsItem label="Сделки" index="1" />
				<TabsItem label="История" index="2" />
				<TabsItem label="Файлы" index="3" />
			</TabsGroup>
		</main>
	</div>
</div>
