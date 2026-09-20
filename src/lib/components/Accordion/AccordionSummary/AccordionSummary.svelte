<script lang="ts">
	// Port of packages/ui-kit/src/components/Accordion/AccordionSummary/AccordionSummary.tsx
	//
	//   <AccordionSummary px="atmr-spacing-2x" cursor="pointer">
	//     {#snippet children({ isOpen, disabled })}<Typography>Header</Typography>{/snippet}
	//   </AccordionSummary>
	//
	// A Box (clickable header of an Accordion): a click toggles the surrounding Accordion. `children` is a snippet that receives
	// `{ isOpen, disabled }` (React allowed a render function as children). `opened_*` / `disabled_*` Box modifier props apply.
	import type { ComponentProps, Snippet } from 'svelte';
	import Box from '../../Box/Box.svelte';
	import { boxMods, boxWithMods } from '../../../utils/boxMods.js';
	import { getAccordion } from '../Providers/AccordionProvider.js';

	type BoxProps = ComponentProps<typeof Box>;

	export interface AccordionSummaryProps extends Omit<BoxProps, 'children' | 'ref' | 'onclick'> {
		/** Отключает заголовок (передаётся в children) */
		disabled?: boolean;
		children?: Snippet<[{ isOpen: boolean; disabled: boolean }]>;
		/** Box-пропсы с модификаторами: `opened_bg`, `disabled_cursor` ... */
		[key: string]: unknown;
	}

	let { disabled = false, children, ...boxProps }: AccordionSummaryProps = $props();

	const accordion = getAccordion();

	const mods = $derived(boxMods({ opened: accordion.isOpen, disabled }));
	const boxPropsWithMods = $derived(boxWithMods(boxProps, mods));
</script>

<!-- React: onClick={toggle} comes after {...boxProps}, so it wins over a user handler -->
<Box {...boxPropsWithMods} onclick={() => accordion.toggle()}>{@render children?.({ isOpen: accordion.isOpen, disabled })}</Box>
