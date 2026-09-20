<script lang="ts">
	// Port of packages/sidemenu/src/react/SideMenu.tsx (root `SideMenu` + `SideMenuProvider`)
	//
	//   <SideMenu isOpened={open}>
	//     <SideMenuHeader>...</SideMenuHeader> <SideMenuSearch>...</SideMenuSearch>
	//     <SideMenuContent><SideMenuItem>{#snippet prefix()}<Home />{/snippet}Text</SideMenuItem>...</SideMenuContent>
	//     <SideMenuFooter><SideMenuHideButton onclick={...} /></SideMenuFooter>
	//   </SideMenu>
	//
	// The React static members (SideMenu.Item, SideMenu.Header ...) are separate files here: SideMenuItem.svelte, SideMenuHeader.svelte ...
	// DOM: <div class="atmr-box atmr-side-menu atmr-side-menu--opened|--closed" ...>children</div>
	// `useSideMenu()` (./context.ts) gives `{ isMenuOpen, searchQuery, setSearchQuery }` to everything inside (the search text lives here).
	import clsx from 'clsx';
	import type { ComponentProps, Snippet } from 'svelte';
	import Box from '../Box/Box.svelte';
	import { boxMods, boxWithMods } from '../../utils/boxMods.js';
	import { noop } from '../../utils/noop.js';
	// [ext, not in original] author's motion extension (off by default, see src/lib/ext/README.md)
	import { useMotion, type MotionProp } from '../../ext/motion.svelte.js';
	import { useSideMenuMotion } from '../../ext/sideMenuMotion.svelte.js';
	import { setSideMenuContext } from './context.js';

	type BoxProps = ComponentProps<typeof Box>;

	export interface SideMenuProps extends Omit<BoxProps, 'children' | 'tag' | 'ref'> {
		/** Меню раскрыто (иначе свёрнуто до иконок) */
		isOpened?: boolean;
		children?: Snippet;
		/** Корневой элемент (аналог forwardRef) */
		ref?: HTMLElement | null;
		/**
		 * [ext, not in original] Svelte-анимация панели: ширину и прозрачность подписей ведёт один Tween (или Spring) — подписи появляются, когда для них
		 * есть место, и исчезают до сужения панели (закрытое состояние отрисовывается после анимации); вложенные группы (`SideMenuCollapse`) и блок
		 * `SideMenuExpandContent` наследуют проп (height: Tween / Spring + fade). `undefined` — наследуется от `ExtMotionProvider` (без него выключено = оригинал:
		 * CSS `transition` ширины, подписи появляются и исчезают сразу), `false` — выключено, `true` / `'tween'` / `'spring'` / `{ duration, easing, stiffness, damping }` — включено.
		 */
		motion?: MotionProp;
		[key: string]: unknown;
	}

	let { children, class: className, isOpened = false, ref = $bindable(null), motion, ...boxProps }: SideMenuProps = $props();

	let searchQuery = $state('');

	// [ext] `menu.open` is `isOpened` while motion is off (the default); with it on it stays `true` while the panel closes, so the labels can fade out first
	const m = useMotion(() => motion, 'sidemenu');
	const menu = useSideMenuMotion({ m, node: () => ref, open: () => isOpened, prop: () => motion });

	setSideMenuContext({
		get isMenuOpen() {
			return menu.open;
		},
		get motion() {
			return motion;
		},
		toggle: noop,
		get searchQuery() {
			return searchQuery;
		},
		setSearchQuery: (value: string) => {
			searchQuery = value;
		}
	});

	const mods = $derived(boxMods({ opened: menu.open }));
	const boxPropsWithMods = $derived(boxWithMods(boxProps, mods));
	const rootClassName = $derived(
		clsx('atmr-side-menu', { 'atmr-side-menu--opened': menu.open, 'atmr-side-menu--closed': !menu.open }, menu.animating && 'rt-ext-side-menu--motion', className)
	);
</script>

<Box {...boxPropsWithMods} tag="div" class={rootClassName} bind:ref>{@render children?.()}</Box>
