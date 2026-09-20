<script lang="ts">
	// Port of Patterns & Recipes/SideMenu/Adaptive Item Size -> AdaptiveItemSize
	import './_patterns-recipes-sidemenu-adaptive-item-size--adaptive-item-size.css';
	import SideMenu from '$lib/components/SideMenu/SideMenu.svelte';
	import SideMenuCollapse from '$lib/components/SideMenu/SideMenuCollapse.svelte';
	import SideMenuCollapseContent from '$lib/components/SideMenu/SideMenuCollapseContent.svelte';
	import SideMenuCollapseTrigger from '$lib/components/SideMenu/SideMenuCollapseTrigger.svelte';
	import SideMenuContent from '$lib/components/SideMenu/SideMenuContent.svelte';
	import SideMenuDivider from '$lib/components/SideMenu/SideMenuDivider.svelte';
	import SideMenuFooter from '$lib/components/SideMenu/SideMenuFooter.svelte';
	import SideMenuHeader from '$lib/components/SideMenu/SideMenuHeader.svelte';
	import SideMenuHideButton from '$lib/components/SideMenu/SideMenuHideButton.svelte';
	import SideMenuItem from '$lib/components/SideMenu/SideMenuItem.svelte';
	import Empty from '$lib/icons/24/action/Empty.svelte';
	import Home from '$lib/icons/24/action/Home.svelte';
	import Bullet from '$lib/icons/24/editor/Bullet.svelte';
	import RTKHeaderContent from './_RTKHeaderContent.svelte';

	interface MenuChild {
		key: string;
		label: string;
		variant?: 'wrap' | 'truncate';
		hasIcon?: boolean;
		children?: MenuChild[];
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
				{ key: 'item1', label: 'Item text', hasIcon: true },
				{ key: 'item2', label: 'Item text', hasIcon: true }
			]
		},
		{
			key: 'group2',
			topDivider: true,
			children: [
				{ key: 'item3', label: 'Item text', hasIcon: true },
				{
					key: 'collapse',
					label: 'Item text',
					variant: 'wrap',
					hasIcon: true,
					children: [
						{ key: 'collapse-item1', label: 'Item text' },
						{ key: 'collapse-item2', label: 'Extremely long terminology element that should wrap to multiple lines', variant: 'wrap' },
						{ key: 'collapse-item3', label: 'Item text' },
						{ key: 'collapse-item4', label: 'Another very long menu item with complex terminology that needs to be displayed in full', variant: 'truncate' }
					]
				},
				{ key: 'item4', label: 'Item text', hasIcon: true }
			]
		},
		{
			key: 'group3',
			topDivider: true,
			children: [
				{ key: 'item5', label: 'Item text', hasIcon: true },
				{ key: 'item6', label: 'Item text', hasIcon: true },
				{ key: 'item7', label: 'Item text', hasIcon: true }
			]
		}
	];

	let menuIsOpen = $state(true);
	let selectedKey = $state('collapse-item2');
</script>

{#snippet homeIcon()}<Home />{/snippet}
{#snippet bulletIcon()}<Bullet />{/snippet}
{#snippet emptyIcon()}<Empty />{/snippet}

<div class="stories-main-side-menu">
	<SideMenu isOpened={menuIsOpen}>
		<SideMenuHeader><RTKHeaderContent {menuIsOpen} /></SideMenuHeader>

		<SideMenuContent class="atmr-scroll-bar">
			{#each MENU_ITEMS as item (item.key)}
				{#if item.topDivider}<SideMenuDivider />{/if}
				{#each item.children as child (child.key)}
					{#if child.children}
						{@const hasSelectedChild = child.children.some((innerChild) => innerChild.key === selectedKey)}
						<SideMenuCollapse>
							<SideMenuCollapseTrigger prefix={child.hasIcon ? homeIcon : undefined} selected={!menuIsOpen && hasSelectedChild}>
								{child.label}
							</SideMenuCollapseTrigger>
							<SideMenuCollapseContent>
								{#each child.children as innerChild (innerChild.key)}
									<SideMenuItem
										variant={innerChild.variant}
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
						<SideMenuItem prefix={child.hasIcon ? homeIcon : undefined} selected={child.key === selectedKey} onclick={() => (selectedKey = child.key)}>
							{child.label}
						</SideMenuItem>
					{/if}
				{/each}
			{/each}
		</SideMenuContent>

		<SideMenuFooter>
			<SideMenuHideButton onclick={() => (menuIsOpen = !menuIsOpen)} />
		</SideMenuFooter>
	</SideMenu>
</div>
