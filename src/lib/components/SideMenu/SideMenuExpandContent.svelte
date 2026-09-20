<script lang="ts">
	// Port of packages/sidemenu/src/react/SideMenuExpandContent.tsx
	//
	//   <SideMenuExpandContent isOpened={expanded}><SideMenuItem>...</SideMenuItem></SideMenuExpandContent>
	//
	// DOM: <div class="atmr-side-menu__expand-content" [aria-hidden hidden tabindex=-1 while exited] style="overflow; transition; visibility; height">
	//        <div class="atmr-box">children</div></div>
	// A react-transition-group `Transition` (see ./transition.svelte.ts) animates the CSS `height` of the wrapper (0 <-> scrollHeight, `auto` once
	// entered); the transition ends on the `transitionend` of `height`. The height is set imperatively (like React), the rest via style directives.
	import clsx from 'clsx';
	import type { ComponentProps, Snippet } from 'svelte';
	import Box from '../Box/Box.svelte';
	import { boxWithMods } from '../../utils/boxMods.js';
	// [ext, not in original] author's motion extension (off by default, see src/lib/ext/README.md)
	import { useCollapseMotion } from '../../ext/collapseMotion.svelte.js';
	import { useMotion, type MotionProp } from '../../ext/motion.svelte.js';
	import { useSideMenu } from './context.js';
	import { useTransition } from './transition.svelte.js';

	type BoxProps = ComponentProps<typeof Box>;

	export interface SideMenuExpandContentProps extends Omit<BoxProps, 'children' | 'tag' | 'ref' | 'class'> {
		/** Дополнительные элементы раскрыты */
		isOpened?: boolean;
		/** Класс обёртки (`atmr-side-menu__expand-content`) */
		class?: string;
		children?: Snippet;
		/** Внутренний Box (аналог forwardRef) */
		ref?: HTMLElement | null;
		/**
		 * [ext, not in original] Svelte-анимация раскрытия блока (высота: Tween или Spring + fade контента). `undefined` — наследуется от `SideMenu` / `ExtMotionProvider`
		 * (без них выключено = оригинал: CSS `transition` высоты), `false` — выключено, `true` / `'tween'` / `'spring'` / `{ duration, easing, stiffness, damping }` — включено.
		 */
		motion?: MotionProp;
		[key: string]: unknown;
	}

	let { children, class: className, isOpened = false, ref = $bindable(null), motion: motionProp, ...boxProps }: SideMenuExpandContentProps = $props();

	const sideMenu = useSideMenu();

	let wrapper = $state<HTMLDivElement | null>(null);

	const boxPropsWithMods = $derived(boxWithMods(boxProps, []));

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

	// [ext, not in original] with motion on, `motion` (a Svelte Tween / Spring, see src/lib/ext/collapseMotion.svelte.ts) replaces the CSS transition of the height and
	// reports its end itself (there is no `transitionend`). With it off (the default) the original code runs.
	const m = useMotion(() => motionProp ?? sideMenu.motion, 'sidemenu');
	const motion = useCollapseMotion({ m, node: () => wrapper, prop: () => motionProp ?? sideMenu.motion, measure: () => computeOpenHeight(getInner(wrapper)), settledOpen: 'auto' });

	const transition = useTransition(() => ({
		in: isOpened,
		addEndListener(done) {
			if (m.enabled) {
				motion.onSettled(done);
				return;
			}
			const node = wrapper;
			if (!node) {
				done();
				return;
			}
			const handleTransitionEnd = (event: TransitionEvent) => {
				if (event.target !== node || event.propertyName !== 'height') return;
				node.removeEventListener('transitionend', handleTransitionEnd);
				done();
			};
			node.addEventListener('transitionend', handleTransitionEnd);
		},
		onEnter() {
			if (!wrapper || (m.enabled && motion.running)) return; // [ext] a running close is reversed from where it is
			wrapper.style.height = '0px';
		},
		onEntering() {
			if (motion.open()) return;
			requestAnimationFrame(() => {
				setOpenHeight();
			});
		},
		onEntered() {
			if (!wrapper) return;
			wrapper.style.height = 'auto';
		},
		onExit() {
			if (!wrapper || m.enabled) return;
			setOpenHeight();
			void wrapper.offsetHeight;
		},
		onExiting() {
			if (motion.close()) return;
			requestAnimationFrame(() => {
				if (!wrapper) return;
				wrapper.style.height = '0px';
			});
		},
		onExited() {
			if (!wrapper) return;
			wrapper.style.height = '0px';
		}
	}));

	const isExited = $derived(transition.status === 'exited');
	const isEntered = $derived(transition.status === 'entered');
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
	bind:this={wrapper}
	class={clsx('atmr-side-menu__expand-content', className)}
	aria-hidden={isExited ? 'true' : 'false'}
	hidden={isExited}
	style:overflow={isEntered ? 'visible' : 'hidden'}
	style:transition="height var(--atmr-motion-duration-m) var(--atmr-motion-easing-expressive-entrance)"
	style:visibility={isExited ? 'hidden' : 'visible'}
	tabindex={isExited ? -1 : undefined}
>
	<Box {...boxPropsWithMods} tag="div" bind:ref>{@render children?.()}</Box>
</div>
