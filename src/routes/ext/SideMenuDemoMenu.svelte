<!-- EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. -->
<script lang="ts">
	/** EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. */
	// One live SideMenu of the /ext demo (see SideMenuDemo.svelte): header, items with icons, a nested group (SideMenuCollapse), an "expand" block
	// (SideMenuExpandContent) and the hide button. It is built ONLY from the original side menu components: the labels come and go by the menu's own
	// state (`useSideMenu()`), not by the consumer's, so the extension's delayed close (labels fade out before the panel shrinks) applies to all of them.
	import Button from '$lib/components/Button/Button/Button.svelte';
	import SideMenu from '$lib/components/SideMenu/SideMenu.svelte';
	import SideMenuCollapse from '$lib/components/SideMenu/SideMenuCollapse.svelte';
	import SideMenuCollapseContent from '$lib/components/SideMenu/SideMenuCollapseContent.svelte';
	import SideMenuCollapseTrigger from '$lib/components/SideMenu/SideMenuCollapseTrigger.svelte';
	import SideMenuContent from '$lib/components/SideMenu/SideMenuContent.svelte';
	import SideMenuDivider from '$lib/components/SideMenu/SideMenuDivider.svelte';
	import SideMenuExpand from '$lib/components/SideMenu/SideMenuExpand.svelte';
	import SideMenuExpandContent from '$lib/components/SideMenu/SideMenuExpandContent.svelte';
	import SideMenuFooter from '$lib/components/SideMenu/SideMenuFooter.svelte';
	import SideMenuHeader from '$lib/components/SideMenu/SideMenuHeader.svelte';
	import SideMenuHideButton from '$lib/components/SideMenu/SideMenuHideButton.svelte';
	import SideMenuItem from '$lib/components/SideMenu/SideMenuItem.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import Home from '$lib/icons/24/action/Home.svelte';
	import Bullet from '$lib/icons/24/editor/Bullet.svelte';
	import Empty from '$lib/icons/24/action/Empty.svelte';
	import type { MotionProp } from '$lib/ext/motion.svelte.js';
	import SideMenuDemoHeader from './SideMenuDemoHeader.svelte';

	let { id, motion }: { id: string; motion?: MotionProp } = $props();

	let open = $state(true);
	let expanded = $state(false);
	let selected = $state('components');
	const MAIN = ['О Дизайн-системе', 'Основы и стиль'];
	const NESTED = ['Button', 'Input', 'Select'];
	const EXTRA = ['История изменений', 'Единый опыт'];
</script>

{#snippet homeIcon()}<Home />{/snippet}
{#snippet bulletIcon()}<Bullet />{/snippet}
{#snippet emptyIcon()}<Empty />{/snippet}

<div class="wrap">
	<div class="row">
		<Button size="s" variant="outline" colorScheme="neutral" label={open ? 'Свернуть' : 'Раскрыть'} onclick={() => (open = !open)} data-testid="{id}-toggle" />
		<Typography variant="body-s" as="span" class="muted" data-testid="{id}-state">{open ? 'isOpened = true' : 'isOpened = false'}</Typography>
	</div>
	<div class="frame">
		<SideMenu isOpened={open} {motion} data-testid={id}>
			<SideMenuHeader><SideMenuDemoHeader /></SideMenuHeader>
			<SideMenuContent class="atmr-scroll-bar">
				{#each MAIN as label (label)}
					<SideMenuItem prefix={homeIcon} selected={selected === label} onclick={() => (selected = label)}>{label}</SideMenuItem>
				{/each}
				<SideMenuDivider />
				<SideMenuCollapse>
					<SideMenuCollapseTrigger prefix={homeIcon} data-testid="{id}-collapse-trigger">Компоненты</SideMenuCollapseTrigger>
					<SideMenuCollapseContent data-testid="{id}-collapse-content">
						{#each NESTED as label (label)}
							<SideMenuItem prefix={selected === label ? bulletIcon : emptyIcon} selected={selected === label} onclick={() => (selected = label)}>{label}</SideMenuItem>
						{/each}
					</SideMenuCollapseContent>
				</SideMenuCollapse>
				<SideMenuExpandContent isOpened={expanded} {motion} data-testid="{id}-expand-content">
					{#each EXTRA as label (label)}
						<SideMenuItem prefix={homeIcon} selected={selected === label} onclick={() => (selected = label)}>{label}</SideMenuItem>
					{/each}
				</SideMenuExpandContent>
				<SideMenuExpand isOpened={expanded} onclick={() => (expanded = !expanded)} data-testid="{id}-expand" />
			</SideMenuContent>
			<SideMenuFooter>
				<SideMenuHideButton onclick={() => (open = !open)} data-testid="{id}-hide" />
			</SideMenuFooter>
		</SideMenu>
	</div>
</div>

<style>
	.wrap {
		display: flex;
		flex-direction: column;
		gap: var(--atmr-spacing-2x);
		min-width: 0;
	}
	.row {
		display: flex;
		align-items: center;
		gap: var(--atmr-spacing-3x);
	}
	.frame {
		display: flex;
		height: 520px;
		overflow: hidden;
		border-radius: var(--atmr-border-radius-l);
		border: var(--atmr-border-width-s) solid var(--atmr-border-soft);
		background-color: var(--atmr-bg-page);
	}
</style>
