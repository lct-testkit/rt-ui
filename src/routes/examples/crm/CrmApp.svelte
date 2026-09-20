<script lang="ts">
	// App shell of the CRM example: SideMenu (left) + TopMenu (breadcrumbs, demo switches, user menu) + the screen in the middle.
	// Everything is a library component; the only own CSS is the page layout (./crm.css).
	import { onMount } from 'svelte';
	import './crm.css';
	import Breadcrumbs from '$lib/components/Breadcrumbs/Breadcrumbs.svelte';
	import IconButton from '$lib/components/Button/IconButton/IconButton.svelte';
	import Drawer from '$lib/components/Drawer/Drawer.svelte';
	import DropdownMenu from '$lib/components/DropdownMenu/DropdownMenu.svelte';
	import Select from '$lib/components/Select/Select.svelte';
	import SegmentedControl from '$lib/components/SegmentedControl/SegmentedControl.svelte';
	import Segment from '$lib/components/SegmentedControl/Segment/Segment.svelte';
	import SideMenu from '$lib/components/SideMenu/SideMenu.svelte';
	import SideMenuContent from '$lib/components/SideMenu/SideMenuContent.svelte';
	import SideMenuFooter from '$lib/components/SideMenu/SideMenuFooter.svelte';
	import SideMenuHeader from '$lib/components/SideMenu/SideMenuHeader.svelte';
	import SideMenuHideButton from '$lib/components/SideMenu/SideMenuHideButton.svelte';
	import SideMenuItem from '$lib/components/SideMenu/SideMenuItem.svelte';
	import Switch from '$lib/components/Switch/Switch.svelte';
	import TopMenu from '$lib/components/TopMenu/TopMenu.svelte';
	import TopMenuActionsContainer from '$lib/components/TopMenu/TopMenuActionsContainer.svelte';
	import TopMenuProductContainer from '$lib/components/TopMenu/TopMenuProductContainer.svelte';
	import TopMenuProfileContainer from '$lib/components/TopMenu/TopMenuProfileContainer.svelte';
	import TopMenuUtilitiesContainer from '$lib/components/TopMenu/TopMenuUtilitiesContainer.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import { useNotificationsStack } from '$lib/components/Notifications/hooks.svelte.js';
	import { useBreakpoint } from '$lib/ext/responsive.svelte.js';
	import Home from '$lib/icons/24/action/Home.svelte';
	import NotificationNew from '$lib/icons/24/action/NotificationNew.svelte';
	import Settings from '$lib/icons/24/action/Settings.svelte';
	import Task from '$lib/icons/24/communication/Task.svelte';
	import Users from '$lib/icons/24/communication/Users.svelte';
	import BarChart from '$lib/icons/24/business/BarChart.svelte';
	import Wallet from '$lib/icons/24/business/Wallet.svelte';
	import Government from '$lib/icons/24/culture/Government.svelte';
	import ChevronDown from '$lib/icons/24/navigation/ChevronDown.svelte';
	import Menu from '$lib/icons/24/navigation/Menu.svelte';
	import Organizations from './Organizations.svelte';
	import { CURRENT_USER } from './data.js';

	let {
		theme = $bindable(),
		motion = $bindable(),
		themes
	}: { theme: string; motion: boolean; themes: { key: string; value: string }[] } = $props();
	// (`bind:theme` / `bind:motion` in +page.svelte: the switches below write back to the page, which owns the body class)

	const { addNotification } = useNotificationsStack();
	// adaptive shell: desktop (>= 1024) = SideMenu + TopMenu, tablet (768-1023) = collapsed SideMenu, phone (< 768) = burger + SideMenu inside a left Drawer
	const bp = useBreakpoint();
	let menuOpen = $state(true);
	onMount(() => {
		if (innerWidth < 1400) menuOpen = false; // narrow window: start with the collapsed (icons only) menu
	});
	let userMenuOpen = $state(false);
	let navOpen = $state(false); // the phone menu (Drawer)

	// theme = `rtk_<palette>_<mode>`; on a phone two segmented controls replace the Select of the demo switches
	const palette = $derived(theme.split('_')[1] ?? 'default');
	const mode = $derived(theme.split('_')[2] ?? 'light');

	// Side menu: only "Организации" is a real screen of this demo, the other items answer with a toast
	const MENU = [
		{ label: 'Главная', icon: Home },
		{ label: 'Организации', icon: Government, selected: true },
		{ label: 'Контакты', icon: Users },
		{ label: 'Сделки', icon: Wallet },
		{ label: 'Задачи', icon: Task },
		{ label: 'Отчёты', icon: BarChart },
		{ label: 'Настройки', icon: Settings }
	];
	const stub = (label: string) =>
		addNotification({ title: `Раздел «${label}»`, subtitle: 'Не входит в демо: в примере готов только экран «Организации».', colorScheme: 'info', closeButton: true, timeout: 4000 });

	const USER_ITEMS = [
		{ key: 'profile', value: 'Мой профиль' },
		{ key: 'settings', value: 'Настройки' },
		{ key: 'exit', value: 'Выйти' }
	];
</script>

{#snippet crumbHome()}<a href="#crm">CRM</a>{/snippet}
{#snippet crumbClients()}<a href="#clients">Клиенты</a>{/snippet}
{#snippet crumbOrgs()}<a href="#orgs">Организации</a>{/snippet}
{#snippet avatar()}
	<img src="/story-assets/profileAvatarExample.jpg" alt="" width="36" height="36" class="atmr-top-menu__profile-avatar" />
{/snippet}
{#snippet chevron()}<ChevronDown />{/snippet}
{#snippet bell()}<NotificationNew />{/snippet}

{#snippet menuIcon()}<Menu />{/snippet}

{#snippet demoSwitches()}
	<div class="crm__demo-stack">
		<Typography variant="description-l" class="crm__muted">Оформление (демо)</Typography>
		<SegmentedControl size="m" value={palette} onChange={(v: string) => (theme = `rtk_${v}_${mode}`)}>
			<Segment index="default" label="Rostelecom" />
			<Segment index="purple" label="Purple" />
		</SegmentedControl>
		<SegmentedControl size="m" value={mode} onChange={(v: string) => (theme = `rtk_${palette}_${v}`)}>
			<Segment index="light" label="Светлая" />
			<Segment index="dark" label="Тёмная" />
		</SegmentedControl>
		<Switch size="s" label="Анимации (вне оригинала)" checked={motion} onChange={(v: boolean) => (motion = v)} data-testid="motion-switch-mobile" />
	</div>
{/snippet}

<div class="crm" class:crm--mobile={bp.isMobile} class:crm--tablet={bp.isTablet}>
	{#if !bp.isMobile}
	<SideMenu isOpened={menuOpen}>
		<SideMenuHeader>
			<div class="crm__brand">
				<img src="/story-assets/RostelecomB2C.svg" alt="" width="32" height="32" />
				{#if menuOpen}
					<div>
						<Typography variant="body-s" strong>Вузы · CRM</Typography>
						<Typography variant="description-l" style={{ color: 'var(--atmr-fg-muted)' }}>демо-приложение</Typography>
					</div>
				{/if}
			</div>
		</SideMenuHeader>

		<SideMenuContent class="atmr-scroll-bar">
			{#each MENU as item (item.label)}
				<SideMenuItem selected={item.selected} onclick={() => !item.selected && stub(item.label)}>
					{#snippet prefix()}<item.icon />{/snippet}
					{item.label}
				</SideMenuItem>
			{/each}
		</SideMenuContent>

		<SideMenuFooter>
			<SideMenuHideButton onclick={() => (menuOpen = !menuOpen)} />
		</SideMenuFooter>
	</SideMenu>
	{/if}

	<div class="crm__main">
		<TopMenu>
			{#if bp.isMobile}
				<!-- phone: burger + brand instead of the side menu and breadcrumbs -->
				<TopMenuProductContainer align="left">
					<IconButton variant="ghost" colorScheme="neutral" size="l" icon={menuIcon} aria-label="Открыть меню" onclick={() => (navOpen = true)} data-testid="burger" />
					<div class="crm__brand crm__brand--top">
						<img src="/story-assets/RostelecomB2C.svg" alt="" width="28" height="28" />
						<Typography variant="body-m" strong>Вузы · CRM</Typography>
					</div>
				</TopMenuProductContainer>
			{:else}
				<TopMenuProductContainer align="left">
					<Breadcrumbs size="s" children={[crumbHome, crumbClients, crumbOrgs]} />
				</TopMenuProductContainer>

				<!-- demo switches: the theme (class on <body>) and the author's motion extension -->
				<TopMenuActionsContainer>
					<div class="crm__demo">
						<div class="crm__demo-theme">
							<Select size="s" items={themes} value={theme} deselectEnabled={false} autocomplete={{ enabled: false }} onChange={(k: string | number) => k && (theme = String(k))} />
						</div>
						<Switch size="s" label="Анимации (вне оригинала)" checked={motion} onChange={(v: boolean) => (motion = v)} data-testid="motion-switch" />
					</div>
				</TopMenuActionsContainer>
			{/if}

			<TopMenuUtilitiesContainer>
				<div class="atmr-top-menu__utilities-icon" aria-label="Уведомления"><NotificationNew /></div>
			</TopMenuUtilitiesContainer>

			<!-- user menu -->
			<DropdownMenu class="crm__usermenu" items={USER_ITEMS} isOpened={userMenuOpen} placement="bottomRight" onClose={() => (userMenuOpen = false)}
				onClickItem={(item) => addNotification({ title: String(item.value), subtitle: `${CURRENT_USER}`, colorScheme: 'success', timeout: 3000 })}>
				{#if bp.isMobile}
					<TopMenuProfileContainer prefix={avatar} onclick={() => (userMenuOpen = !userMenuOpen)} aria-label={CURRENT_USER} data-testid="user-menu" />
				{:else}
					<TopMenuProfileContainer prefix={avatar} title={CURRENT_USER} hint="Менеджер по вузам" suffix={chevron} onclick={() => (userMenuOpen = !userMenuOpen)} data-testid="user-menu" />
				{/if}
			</DropdownMenu>
		</TopMenu>

		<main class="crm__content">
			<Organizations />
		</main>
	</div>
</div>

<!-- phone menu: the same SideMenu in a left Drawer (full height); items close it, the demo switches live at its bottom -->
{#if bp.isMobile}
	<Drawer class="crm-nav" position="left" fullHeight dimension={Math.min(320, Math.max(240, bp.width - 56))} isOpened={navOpen}
		onClickOverlay={() => (navOpen = false)} onClose={() => (navOpen = false)}>
		<SideMenu isOpened>
			<SideMenuHeader>
				<div class="crm__brand">
					<img src="/story-assets/RostelecomB2C.svg" alt="" width="32" height="32" />
					<div>
						<Typography variant="body-s" strong>Вузы · CRM</Typography>
						<Typography variant="description-l" style={{ color: 'var(--atmr-fg-muted)' }}>демо-приложение</Typography>
					</div>
				</div>
			</SideMenuHeader>
			<SideMenuContent class="atmr-scroll-bar">
				{#each MENU as item (item.label)}
					<SideMenuItem selected={item.selected} onclick={() => { navOpen = false; if (!item.selected) stub(item.label); }}>
						{#snippet prefix()}<item.icon />{/snippet}
						{item.label}
					</SideMenuItem>
				{/each}
			</SideMenuContent>
			<SideMenuFooter>
				{@render demoSwitches()}
			</SideMenuFooter>
		</SideMenu>
	</Drawer>
{/if}
