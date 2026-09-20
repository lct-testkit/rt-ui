<script lang="ts">
	// Port of packages/ui-kit/src/components/Accordion/AccordionDetails/AccordionDetails.tsx
	//
	//   <AccordionDetails px="atmr-spacing-2x" pb="atmr-spacing-2x">content</AccordionDetails>
	//
	// The collapsible part of an Accordion: a Box (all Box props + the `opened_*` modifier props) inside a wrapper whose height is animated
	// with a CSS transition (react-transition-group `Transition`, timeout 300 ms; see ../transition.svelte.ts).
	//
	// DOM: <div [aria-hidden hidden tabindex=-1 while exited] style="height; overflow; transition; visibility"><div class="atmr-box ...">children</div></div>
	// While the accordion is open the wrapper height follows the content height (ResizeObserver + window resize).
	import type { ComponentProps, Snippet } from 'svelte';
	import { untrack } from 'svelte';
	import Box from '../../Box/Box.svelte';
	import { boxMods, boxWithMods } from '../../../utils/boxMods.js';
	// [ext, not in original] author's motion extension (off by default, see src/lib/ext/README.md)
	import { useCollapseMotion } from '../../../ext/collapseMotion.svelte.js';
	import { useMotion, type MotionProp } from '../../../ext/motion.svelte.js';
	import { getAccordion } from '../Providers/AccordionProvider.js';
	import { ACCORDION_DETAILS_DURATION } from '../constants.js';
	import { useTransition } from '../transition.svelte.js';

	type BoxProps = ComponentProps<typeof Box>;

	export interface AccordionDetailsProps extends Omit<BoxProps, 'children' | 'ref'> {
		children?: Snippet;
		/**
		 * [ext, not in original] Svelte-анимация раскрытия / сворачивания: высота обёртки (Tween или Spring) + fade и небольшой сдвиг контента, плавное
		 * изменение высоты при смене содержимого. `undefined` — от `Accordion` / `ExtMotionProvider` (без них выключено = оригинал: CSS `transition` высоты),
		 * `false` — выключено, `true` / `'tween'` / `'spring'` / `{ duration, easing, stiffness, damping }` — включено.
		 */
		motion?: MotionProp;
		/** Box-пропсы с модификаторами: `opened_bg`, `opened_px` ... */
		[key: string]: unknown;
	}

	let { children, motion: motionProp, ...boxProps }: AccordionDetailsProps = $props();

	const accordion = getAccordion();
	let wrapper = $state<HTMLDivElement | null>(null);

	const mods = $derived(boxMods({ opened: accordion.isOpen }));
	const boxPropsWithMods = $derived(boxWithMods(boxProps, mods));

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

	// [ext, not in original] with motion on, `collapse` (a Svelte Tween / Spring, see src/lib/ext/collapseMotion.svelte.ts) replaces the inline CSS transition:
	// it reports its end to the state machine (`addEndListener`) instead of a fixed timeout. With it off (the default) the original code runs.
	const m = useMotion(() => motionProp ?? accordion.motion, 'accordion');
	const collapse = useCollapseMotion({ m, node: () => wrapper, prop: () => motionProp ?? accordion.motion, measure: () => computeOpenHeight(getInner(wrapper)) });

	const transition = useTransition(() => ({
		in: accordion.isOpen,
		timeout: m.enabled ? undefined : ACCORDION_DETAILS_DURATION,
		addEndListener: m.enabled ? (done) => collapse.onSettled(done) : undefined,
		onEnter() {
			if (!wrapper || (m.enabled && collapse.running)) return; // [ext] a running close is reversed from where it is
			wrapper.style.height = '0px';
		},
		onEntering() {
			if (collapse.open()) return;
			setOpenHeight();
		},
		onExit() {
			if (m.enabled) return;
			setOpenHeight();
		},
		onExiting() {
			if (collapse.close()) return;
			if (!wrapper) return;
			wrapper.style.height = '0px';
		}
	}));

	// keep the open height in sync with the content size
	$effect(() => {
		const current = wrapper;
		if (!current || !accordion.isOpen) return undefined;
		const contentEl = getInner(current);
		const recalcHeight = () => {
			if (m.enabled) {
				// [ext] only a settled (or still running) accordion follows its content; while it is starting to open `collapse.open()` measures it
				if (transition.status === 'entered' || collapse.running) collapse.resize();
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
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
	bind:this={wrapper}
	aria-hidden={isExited ? 'true' : 'false'}
	hidden={isExited}
	style:height="0px"
	style:overflow="hidden"
	style:transition="height var(--atmr-motion-duration-m) var(--atmr-motion-easing-expressive-entrance)"
	style:visibility={isExited ? 'hidden' : 'visible'}
	tabindex={isExited ? -1 : undefined}
>
	<Box {...boxPropsWithMods}>{@render children?.()}</Box>
</div>
