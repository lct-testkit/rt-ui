<script lang="ts">
	// Port of packages/sidemenu/src/react/SideMenuCollapseContent.tsx
	//
	//   <SideMenuCollapse>
	//     <SideMenuCollapseTrigger>Title</SideMenuCollapseTrigger>
	//     <SideMenuCollapseContent><SideMenuItem>...</SideMenuItem></SideMenuCollapseContent>
	//   </SideMenuCollapse>
	//
	// Registers its children in the parent SideMenuCollapse (they are shown in the popover while the menu is collapsed); renders
	// nothing while the menu is collapsed, otherwise the animated wrapper (./SideMenuCollapseContentTransition.svelte).
	import { onDestroy, type ComponentProps, type Snippet } from 'svelte';
	import Box from '../Box/Box.svelte';
	import { boxWithMods } from '../../utils/boxMods.js';
	import type { MotionProp } from '../../ext/motion.svelte.js';
	import SideMenuCollapseContentTransition from './SideMenuCollapseContentTransition.svelte';
	import { useSideMenu, useSideMenuCollapse } from './context.js';

	type BoxProps = ComponentProps<typeof Box>;

	export interface SideMenuCollapseContentProps extends Omit<BoxProps, 'children' | 'tag' | 'ref'> {
		children?: Snippet;
		/** Внутренний Box (аналог forwardRef) */
		ref?: HTMLElement | null;
		/**
		 * [ext, not in original] Svelte-анимация раскрытия вложенного списка (высота: Tween или Spring + fade). `undefined` — наследуется от `SideMenu` /
		 * `ExtMotionProvider` (без них выключено = оригинал), `false` — выключено, `true` / `'tween'` / `'spring'` / `{ duration, easing, stiffness, damping }` — включено.
		 */
		motion?: MotionProp;
		[key: string]: unknown;
	}

	let { children, class: className, ref = $bindable(null), motion, ...boxProps }: SideMenuCollapseContentProps = $props();

	const sideMenu = useSideMenu();
	const collapse = useSideMenuCollapse();

	$effect(() => {
		collapse.registerContent(children);
	});
	onDestroy(() => collapse.unregisterContent());

	const boxPropsWithMods = $derived(boxWithMods(boxProps, []));
</script>

{#if sideMenu.isMenuOpen}
	<SideMenuCollapseContentTransition {children} class={className} boxProps={boxPropsWithMods} {motion} bind:ref />
{/if}
