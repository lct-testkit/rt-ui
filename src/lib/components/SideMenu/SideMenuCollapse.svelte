<script lang="ts">
	// Port of packages/sidemenu/src/react/SideMenuCollapse.tsx + Providers/SideMenuCollapseProvider.tsx
	//
	//   <SideMenuCollapse onToggle={(open) => ...} popoverProps={{ ... }}>
	//     <SideMenuCollapseTrigger>...</SideMenuCollapseTrigger>
	//     <SideMenuCollapseContent>...</SideMenuCollapseContent>
	//   </SideMenuCollapse>
	//
	// DOM (menu open):      <div class="atmr-box atmr-side-menu__collapse [--opened]">trigger + content</div>
	// DOM (menu collapsed): <div class="atmr-side-menu__collapse-popover-host"> <Popover ... popoverClassName="atmr-side-menu__collapse-popover"
	//                          placement="rightTop" innerChildren={title + content}>{the same collapse div}</Popover></div>
	// The content registered by SideMenuCollapseContent is shown in the popover (hover on the host opens it, leaving closes it after 150 ms).
	// Svelte: `registerContent` receives the children snippet of SideMenuCollapseContent; `unregisterContent` is deferred by a microtask so that
	// the unmount/mount of CollapseContent caused by the switch between the two DOM shapes does not flip `content` to null and back.
	import clsx from 'clsx';
	import { onDestroy, type ComponentProps, type Snippet } from 'svelte';
	import Box from '../Box/Box.svelte';
	import Popover, { type PopoverProps } from '../Popover/Popover.svelte';
	import Slot from '../../internal/Slot.svelte';
	import type { Content } from '../../internal/types.js';
	import SideMenuPopoverContentProvider from './SideMenuPopoverContentProvider.svelte';
	import SideMenuTitle from './SideMenuTitle.svelte';
	import { setSideMenuCollapseContext, useSideMenu } from './context.js';

	type BoxProps = ComponentProps<typeof Box>;

	export interface SideMenuCollapseProps extends Omit<BoxProps, 'children' | 'tag' | 'ref'> {
		children?: Snippet;
		/** Свойства Popover (в свёрнутом меню) */
		popoverProps?: Partial<PopoverProps>;
		/** Вызывается при раскрытии/сворачивании (`open`) */
		onToggle?: (open: boolean) => void;
		/** Корневой элемент (аналог forwardRef) */
		ref?: HTMLElement | null;
		[key: string]: unknown;
	}

	let { children, class: className, popoverProps, onToggle, ref = $bindable(null), ...boxProps }: SideMenuCollapseProps = $props();

	const sideMenu = useSideMenu();

	let isCollapseOpen = $state(false);
	$effect(() => {
		if (!sideMenu.isMenuOpen) {
			isCollapseOpen = false;
		}
	});

	function toggle() {
		const next = !isCollapseOpen;
		isCollapseOpen = next;
		onToggle?.(next);
	}

	// ---- SideMenuCollapseProvider ----
	let content = $state<Content>(null);
	let title = $state<Content>(null);
	let isPopoverOpen = $state(false);
	const triggerRef: { current: HTMLElement | null } = { current: null };
	let hideTimeout: ReturnType<typeof setTimeout> | null = null;
	let registration = 0;

	function clearHideTimeout() {
		if (hideTimeout) {
			clearTimeout(hideTimeout);
			hideTimeout = null;
		}
	}
	function scheduleHide() {
		hideTimeout = setTimeout(() => {
			isPopoverOpen = false;
		}, 150);
	}
	function handleMouseEnter() {
		clearHideTimeout();
		if (!sideMenu.isMenuOpen && !isCollapseOpen) {
			isPopoverOpen = true;
		}
	}
	function closePopover() {
		clearHideTimeout();
		isPopoverOpen = false;
	}

	$effect(() => {
		if (sideMenu.isMenuOpen || isCollapseOpen) {
			isPopoverOpen = false;
		}
	});
	onDestroy(() => {
		if (hideTimeout) clearTimeout(hideTimeout);
	});

	setSideMenuCollapseContext({
		get isCollapseOpen() {
			return isCollapseOpen;
		},
		get isPopoverOpen() {
			return isPopoverOpen;
		},
		closePopover,
		registerContent(newContent: Content) {
			registration++;
			content = newContent;
		},
		unregisterContent() {
			const version = registration;
			queueMicrotask(() => {
				if (version === registration) content = null;
			});
		},
		setTitle(newTitle: Content) {
			title = newTitle;
		},
		triggerRef,
		toggle
	});

	const rootClassName = $derived(clsx('atmr-side-menu__collapse', { 'atmr-side-menu__collapse--opened': isCollapseOpen }, className));
</script>

{#snippet box()}
	<Box {...boxProps} tag="div" class={rootClassName} bind:ref>{@render children?.()}</Box>
{/snippet}

{#snippet popoverTitle()}
	<Slot content={title} />
{/snippet}

{#snippet popoverInner()}
	<SideMenuPopoverContentProvider>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div onmouseenter={clearHideTimeout} onmouseleave={scheduleHide}>
			{#if title}<SideMenuTitle isOpened children={popoverTitle} />{/if}
			<Slot {content} />
		</div>
	</SideMenuPopoverContentProvider>
{/snippet}

{#if !sideMenu.isMenuOpen && content}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="atmr-side-menu__collapse-popover-host" onmouseenter={handleMouseEnter} onmouseleave={scheduleHide}>
		<Popover
			innerChildren={popoverInner}
			pointer={false}
			offset={16}
			trigger="click"
			isOpened={isPopoverOpen}
			onClose={closePopover}
			useInPortal
			popoverClassName="atmr-side-menu__collapse-popover"
			placement="rightTop"
			{...popoverProps}
			children={box}
		/>
	</div>
{:else}
	{@render box()}
{/if}
