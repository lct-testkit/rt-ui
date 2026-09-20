<script lang="ts">
	// Internal part of SideMenuCollapseContent.tsx: the `Transition` + wrapper that React renders ONLY while the menu is open
	// (`if (!isMenuOpen) return null`), so it is a separate component here (its transition state is created afresh every time the menu opens).
	//
	// DOM: <div class="atmr-side-menu__collapse-content-wrapper" [aria-hidden hidden tabindex=-1 while exited] style="height; overflow; transition; visibility">
	//        <div class="atmr-box atmr-side-menu__collapse-content atmr-side-menu__collapse-content--opened atmr-side-menu__collapse-content--click">children</div></div>
	// While the collapse is open the wrapper height follows the content height (ResizeObserver + window resize); the height is animated by
	// the CSS transition (`timeout` 300 ms only drives the state machine).
	import clsx from 'clsx';
	import type { ClassValue } from 'clsx';
	import { untrack, type ComponentProps, type Snippet } from 'svelte';
	import Box from '../Box/Box.svelte';
	// [ext, not in original] author's motion extension (off by default, see src/lib/ext/README.md)
	import { useCollapseMotion } from '../../ext/collapseMotion.svelte.js';
	import { useMotion, type MotionProp } from '../../ext/motion.svelte.js';
	import { useSideMenu, useSideMenuCollapse } from './context.js';
	import { useTransition } from './transition.svelte.js';

	type BoxProps = ComponentProps<typeof Box>;

	let {
		children,
		class: className,
		boxProps,
		ref = $bindable(null),
		motion: motionProp
	}: { children?: Snippet; class?: ClassValue; boxProps: BoxProps; ref?: HTMLElement | null; motion?: MotionProp } = $props();

	const collapse = useSideMenuCollapse();
	const sideMenu = useSideMenu();
	let wrapper = $state<HTMLDivElement | null>(null);

	const getInner = (node: HTMLElement | null): HTMLElement | null => (node?.firstElementChild as HTMLElement | null) || node || null;
	const computeOpenHeight = (inner: HTMLElement | null): number => {
		if (!inner) return 0;
		const base = inner.scrollHeight || 0;
		const cs = window.getComputedStyle(inner);
		const mt = parseInt(cs.marginTop, 10) || 0;
		const mb = parseInt(cs.marginBottom, 10) || 0;
		return base + mt + mb;
	};
	const setOpenHeight = () => {
		if (!wrapper) return;
		wrapper.style.height = computeOpenHeight(getInner(wrapper)) + 'px';
	};

	// [ext, not in original] with motion on, `motion` (a Svelte Tween / Spring, see src/lib/ext/collapseMotion.svelte.ts) replaces the inline CSS transition and
	// reports its end to the state machine (`addEndListener`) instead of a fixed timeout. With it off (the default) the original code runs.
	const m = useMotion(() => motionProp ?? sideMenu.motion, 'sidemenu');
	const motion = useCollapseMotion({ m, node: () => wrapper, prop: () => motionProp ?? sideMenu.motion, measure: () => computeOpenHeight(getInner(wrapper)) });

	const transition = useTransition(() => ({
		in: collapse.isCollapseOpen,
		timeout: m.enabled ? undefined : 300,
		addEndListener: m.enabled ? (done) => motion.onSettled(done) : undefined,
		onEnter() {
			if (!wrapper || (m.enabled && motion.running)) return; // [ext] a running close is reversed from where it is
			wrapper.style.height = '0px';
		},
		onEntering() {
			if (motion.open()) return;
			setOpenHeight();
		},
		onExit() {
			if (m.enabled) return;
			setOpenHeight();
		},
		onExiting() {
			if (motion.close()) return;
			if (!wrapper) return;
			wrapper.style.height = '0px';
		}
	}));

	// keep the open height in sync with the content size
	$effect(() => {
		const current = wrapper;
		if (!current || !collapse.isCollapseOpen) return undefined;
		const contentEl = getInner(current);
		const recalcHeight = () => {
			if (m.enabled) {
				// [ext] only a settled (or still running) block follows its content; while it is starting to open `motion.open()` measures it
				if (transition.status === 'entered' || motion.running) motion.resize();
				return;
			}
			setOpenHeight();
		};
		let ro: ResizeObserver | undefined;
		if (typeof ResizeObserver !== 'undefined' && contentEl) {
			ro = new ResizeObserver(recalcHeight);
			ro.observe(contentEl);
		}
		window.addEventListener('resize', recalcHeight);
		untrack(recalcHeight);
		return () => {
			window.removeEventListener('resize', recalcHeight);
			ro?.disconnect();
		};
	});

	const isExited = $derived(transition.status === 'exited');
	const rootClassName = $derived(
		clsx(
			'atmr-side-menu__collapse-content',
			{ 'atmr-side-menu__collapse-content--opened': true, 'atmr-side-menu__collapse-content--hover': false, 'atmr-side-menu__collapse-content--click': true },
			className
		)
	);
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
	bind:this={wrapper}
	class="atmr-side-menu__collapse-content-wrapper"
	aria-hidden={isExited ? 'true' : 'false'}
	hidden={isExited}
	style:height="0px"
	style:overflow="hidden"
	style:transition="height var(--atmr-motion-duration-m) var(--atmr-motion-easing-expressive-entrance)"
	style:visibility={isExited ? 'hidden' : 'visible'}
	tabindex={isExited ? -1 : undefined}
>
	<Box {...boxProps} tag="div" class={rootClassName} bind:ref>{@render children?.()}</Box>
</div>
