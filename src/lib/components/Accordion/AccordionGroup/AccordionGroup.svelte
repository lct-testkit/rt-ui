<script lang="ts">
	// Port of packages/ui-kit/src/components/Accordion/AccordionGroup/AccordionGroup.tsx
	//
	//   <AccordionGroup selectionMode="single" flex flexDirection="column" gapY="10px"> <Accordion>...</Accordion> ... </AccordionGroup>
	//
	// A Box (all Box props + the `disabled_*` modifier props) that owns the open/closed state of the Accordions inside it:
	// `selectionMode="multiple"` (default) lets any number stay open, `"single"` keeps at most one open. `disabled` blocks toggling.
	import type { ComponentProps, Snippet } from 'svelte';
	import Box from '../../Box/Box.svelte';
	import { boxMods, boxWithMods } from '../../../utils/boxMods.js';
	import { createAccordionGroup, setAccordionGroup, type AccordionSelectionMode } from '../Providers/AccordionGroupProvider.svelte.js';

	type BoxProps = ComponentProps<typeof Box>;

	export interface AccordionGroupProps extends Omit<BoxProps, 'children' | 'ref'> {
		/** Отключает все аккордеоны группы */
		disabled?: boolean;
		/** Режим выбора: один открытый аккордеон или несколько */
		selectionMode?: AccordionSelectionMode;
		children?: Snippet;
		/** Box-пропсы с модификаторами: `disabled_bg` ... */
		[key: string]: unknown;
	}

	let { disabled = false, children, selectionMode = 'multiple', ...boxProps }: AccordionGroupProps = $props();

	setAccordionGroup(createAccordionGroup(() => ({ selectionMode, disabled })));

	const mods = $derived(boxMods({ disabled }));
	const boxPropsWithMods = $derived(boxWithMods(boxProps, mods));
</script>

<Box {...boxPropsWithMods}>{@render children?.()}</Box>
