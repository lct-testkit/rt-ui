// Port of packages/ui-kit/src/components/Accordion/Providers/AccordionProvider.tsx
//
// React: <AccordionProvider isOpen toggle>...</AccordionProvider> + useAccordion(). Svelte: the Accordion sets the context
// (an object with a reactive `isOpen` getter), AccordionSummary / AccordionDetails read it. Outside of an Accordion the default
// context (`isOpen: false`, `toggle` does nothing) is returned, like the React default value.
import { getContext, setContext } from 'svelte';
import type { MotionProp } from '../../../ext/motion.svelte.js';

export interface AccordionContextValue {
	readonly isOpen: boolean;
	toggle: () => void;
	/** [ext, not in original] the `motion` prop of the Accordion (the AccordionDetails inside inherit it) */
	readonly motion?: MotionProp;
}

const ACCORDION_CONTEXT = Symbol('atmr.accordion');

const defaultContext: AccordionContextValue = {
	isOpen: false,
	toggle: () => undefined
};

export const setAccordion = (value: AccordionContextValue): AccordionContextValue => setContext(ACCORDION_CONTEXT, value);

/** React `useAccordion()` (call during component initialisation; read `.isOpen` lazily to stay reactive). */
export const getAccordion = (): AccordionContextValue => getContext<AccordionContextValue | undefined>(ACCORDION_CONTEXT) ?? defaultContext;
