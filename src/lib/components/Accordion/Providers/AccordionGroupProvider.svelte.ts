// Port of packages/ui-kit/src/components/Accordion/Providers/AccordionGroupProvider.tsx
//
// React: <AccordionGroupProvider selectionMode disabled> keeps `items` (id -> open) in state and exposes { items, toggle, isOpen };
// `useAccordionGroup()` returns the context value, or `false` when there is no group.
// Svelte: `createAccordionGroup(() => ({ selectionMode, disabled }))` (called by AccordionGroup during init) returns that value
// (reactive: `items` is `$state`), `setAccordionGroup` publishes it and `getAccordionGroup()` reads it (`false` = no group).
import { getContext, setContext } from 'svelte';

export type AccordionSelectionMode = 'single' | 'multiple';

export interface AccordionGroupContextValue {
	readonly items: Record<string, boolean>;
	toggle: (id: string) => void;
	isOpen: (id: string) => boolean;
}

export interface AccordionGroupOptions {
	selectionMode?: AccordionSelectionMode;
	disabled?: boolean;
}

const ACCORDION_GROUP_CONTEXT = Symbol('atmr.accordionGroup');

export function createAccordionGroup(options: () => AccordionGroupOptions): AccordionGroupContextValue {
	let items = $state<Record<string, boolean>>({});

	const toggle = (id: string) => {
		const { selectionMode, disabled } = options();
		if (disabled) return;
		// React reads the `items` captured by the render (both `if`s see the same value); use a snapshot as well
		const current = items;
		if (selectionMode === 'single') {
			if (current[id]) {
				items = {};
			} else {
				items = { [id]: true };
			}
			return;
		}
		if (!current[id]) {
			items = { ...current, [id]: true };
		} else {
			items = { ...current, [id]: !current[id] };
		}
	};

	const isOpen = (id: string) => items[id] ?? false;

	return {
		get items() {
			return items;
		},
		toggle,
		isOpen
	};
}

export const setAccordionGroup = (value: AccordionGroupContextValue): AccordionGroupContextValue => setContext(ACCORDION_GROUP_CONTEXT, value);

/** React `useAccordionGroup()`: the group context, or `false` outside of an `AccordionGroup`. */
export const getAccordionGroup = (): AccordionGroupContextValue | false => getContext<AccordionGroupContextValue | undefined>(ACCORDION_GROUP_CONTEXT) ?? false;
