<script lang="ts">
	// Port of `MENU_ITEMS`, `MenuListItem`, `MenuContent` from stories-app/src/stories/SideMenu/1_SideMenu/SideMenu.tsx
	import ListItem from '$lib/components/List/ListItem.svelte';
	import Popover from '$lib/components/Popover/Popover.svelte';
	import SideMenuCollapse from '$lib/components/SideMenu/SideMenuCollapse.svelte';
	import SideMenuCollapseContent from '$lib/components/SideMenu/SideMenuCollapseContent.svelte';
	import SideMenuCollapseTrigger from '$lib/components/SideMenu/SideMenuCollapseTrigger.svelte';
	import SideMenuDivider from '$lib/components/SideMenu/SideMenuDivider.svelte';
	import SideMenuItem from '$lib/components/SideMenu/SideMenuItem.svelte';
	import { useSideMenu } from '$lib/components/SideMenu/context.js';
	import { filterMenuItems } from '$lib/components/SideMenu/utils.js';
	import Empty from '$lib/icons/24/action/Empty.svelte';
	import Home from '$lib/icons/24/action/Home.svelte';
	import Bullet from '$lib/icons/24/editor/Bullet.svelte';

	interface MenuChild {
		key: string;
		label: string;
		hasIcon?: boolean;
		children?: { key: string; label: string }[];
	}
	interface MenuGroup {
		key: string;
		topDivider?: boolean;
		children: MenuChild[];
	}

	// the React data holds `icon: <Home />`; here `hasIcon` marks the items that get the Home icon
	const MENU_ITEMS: MenuGroup[] = [
		{
			key: 'group1',
			children: [
				{ key: 'about', label: 'О Дизайн-системе', hasIcon: true },
				{ key: 'general', label: 'Основы и стиль', hasIcon: true }
			]
		},
		{
			key: 'group2',
			topDivider: true,
			children: [
				{ key: 'tools', label: 'Инструменты', hasIcon: true },
				{
					key: 'components',
					label: 'Компоненты',
					hasIcon: true,
					children: [
						{ key: 'button', label: 'Button' },
						{ key: 'input', label: 'Input' },
						{ key: 'select', label: 'Select' }
					]
				},
				{ key: 'hooks', label: 'Хуки', hasIcon: true }
			]
		},
		{
			key: 'group3',
			topDivider: true,
			children: [
				{ key: 'changes', label: 'История изменений', hasIcon: true },
				{ key: 'exp', label: 'Единый опыт', hasIcon: true },
				{ key: 'support', label: 'Поддержка', hasIcon: true }
			]
		}
	];

	let { menuIsOpen }: { menuIsOpen: boolean } = $props();

	const sideMenu = useSideMenu();
	let selectedKey = $state('components');
	const filteredItems = $derived(filterMenuItems(MENU_ITEMS, sideMenu.searchQuery));
</script>

{#snippet homeIcon()}<Home />{/snippet}
{#snippet bulletIcon()}<Bullet />{/snippet}
{#snippet emptyIcon()}<Empty />{/snippet}

{#snippet menuListItem(child: MenuChild)}
	{#snippet tooltip()}<ListItem class="atmr-side-menu__item">{child.label}</ListItem>{/snippet}
	{#if menuIsOpen}
		<SideMenuItem prefix={child.hasIcon ? homeIcon : undefined} selected={child.key === selectedKey} onclick={() => (selectedKey = child.key)}>
			{child.label}
		</SideMenuItem>
	{:else}
		<Popover innerChildren={tooltip} placement="right" pointer={false} trigger="hover" offset={16} popoverClassName="atmr-side-menu__tooltip">
			<SideMenuItem onclick={() => (selectedKey = child.key)} prefix={child.hasIcon ? homeIcon : undefined} selected={child.key === selectedKey} />
		</Popover>
	{/if}
{/snippet}

{#each filteredItems as item (item.key)}
	{#if item.children}
		{#if item.topDivider}<SideMenuDivider />{/if}
		{#each item.children as child (child.key)}
			{#if child.children && !sideMenu.searchQuery}
				{@const hasSelectedChild = child.children.some((innerChild) => innerChild.key === selectedKey)}
				<SideMenuCollapse>
					<SideMenuCollapseTrigger prefix={child.hasIcon ? homeIcon : undefined} selected={!menuIsOpen && hasSelectedChild}>
						{child.label}
					</SideMenuCollapseTrigger>
					<SideMenuCollapseContent>
						{#each child.children as innerChild (innerChild.key)}
							<SideMenuItem
								prefix={menuIsOpen ? (innerChild.key === selectedKey ? bulletIcon : emptyIcon) : null}
								selected={innerChild.key === selectedKey}
								onclick={() => (selectedKey = innerChild.key)}
							>
								{innerChild.label}
							</SideMenuItem>
						{/each}
					</SideMenuCollapseContent>
				</SideMenuCollapse>
			{:else}
				{@render menuListItem(child)}
			{/if}
		{/each}
	{/if}
{/each}
