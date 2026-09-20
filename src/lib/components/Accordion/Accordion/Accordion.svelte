<script lang="ts">
	// Port of packages/ui-kit/src/components/Accordion/Accordion/Accordion.tsx
	//
	//   <Accordion isOpen style="width: 400px">
	//     <AccordionSummary cursor="pointer">{#snippet children({ isOpen })}...{/snippet}</AccordionSummary>
	//     <AccordionDetails>content</AccordionDetails>
	//   </Accordion>
	//
	// (React: Accordion.Group / Accordion.Summary / Accordion.Details -> AccordionGroup / AccordionSummary / AccordionDetails.)
	//
	// A Box that owns the open state: local state seeded with `isOpen` (uncontrolled), or - inside an AccordionGroup - the state of
	// the group (selectionMode single/multiple). Like React, the `isOpen` prop only ever OPENS an accordion (an effect calls toggle
	// when `isOpen` becomes true and the accordion is closed); `disabled` blocks toggling.
	import type { ComponentProps, Snippet } from 'svelte';
	import { untrack } from 'svelte';
	import Box from '../../Box/Box.svelte';
	import type { StyleValue } from '../../../utils/style.js';
	import type { MotionProp } from '../../../ext/motion.svelte.js';
	import { boxMods, boxWithMods } from '../../../utils/boxMods.js';
	import { getAccordionGroup } from '../Providers/AccordionGroupProvider.svelte.js';
	import { setAccordion } from '../Providers/AccordionProvider.js';

	type BoxProps = ComponentProps<typeof Box>;

	export interface AccordionProps extends Omit<BoxProps, 'children' | 'ref' | 'style'> {
		/** Отключает аккордеон */
		disabled?: boolean;
		/** Открывает аккордеон */
		isOpen?: boolean;
		style?: StyleValue;
		children?: Snippet;
		/**
		 * [ext, not in original] Svelte-анимация раскрытия / сворачивания содержимого (высота: Tween или Spring + fade контента); наследуется
		 * дочерним `AccordionDetails` (его собственный проп сильнее). `undefined` — от `ExtMotionProvider` (без него выключено = оригинал), `false` — выключено,
		 * `true` / `'tween'` / `'spring'` / `{ duration, easing, stiffness, damping }` — включено.
		 */
		motion?: MotionProp;
		/** Box-пропсы с модификаторами: `opened_bg`, `disabled_cursor` ... */
		[key: string]: unknown;
	}

	let { disabled = false, children, isOpen: isOpenProp = false, style, motion, ...boxProps }: AccordionProps = $props();

	// React: useRef(useId()) - one id per accordion instance (the key inside the group state)
	const elemId = $props.id();
	const group = getAccordionGroup();

	// svelte-ignore state_referenced_locally
	let localIsOpen = $state(isOpenProp);

	const isOpen = $derived(group ? group.isOpen(elemId) : localIsOpen);

	function toggle() {
		if (disabled) return;
		localIsOpen = !localIsOpen;
		if (group) {
			group.toggle(elemId);
		}
	}

	// useEffect(() => { if (_isOpen && !isOpen) toggle(); }, [_isOpen])
	$effect(() => {
		const requested = isOpenProp;
		untrack(() => {
			if (requested && !isOpen) toggle();
		});
	});

	setAccordion({
		get isOpen() {
			return isOpen;
		},
		toggle,
		get motion() {
			return motion;
		}
	});

	const mods = $derived(boxMods({ opened: isOpen, disabled }));
	const boxPropsWithMods = $derived(boxWithMods(boxProps, mods));
</script>

<Box {...boxPropsWithMods} {style}>{@render children?.()}</Box>
