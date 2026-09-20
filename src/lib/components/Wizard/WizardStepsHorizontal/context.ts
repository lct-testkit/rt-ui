// Port of packages/ui-kit/src/components/Wizard/WizardStepsHorizontal/context.ts
// React: StepsGroupContext = createContext(undefined) holding { textPlacement, variant, size, currentStep }.
// Svelte: the context value is an object with reactive getters, plus the step registration API which replaces
// React's `cloneElement(child, { 'data-step', style, className })` done by useRenderStepsBySlots.
import { getContext, setContext } from 'svelte';
import type { StepTextAlignment } from '../StepItemHorizontal/types.js';
import type { WizardSize, WizardVariant } from '../constants.js';
import type { MotionHandle } from '../../../ext/motion.svelte.js';

export interface StepsGroupContextValue {
	readonly textPlacement: StepTextAlignment;
	readonly variant: WizardVariant;
	readonly size: WizardSize;
	readonly currentStep: number;
	/** value of the inline `max-width` given to the last step */
	readonly maxWidthLastStep: string;
	/** number of registered (slot) steps */
	readonly count: number;
	/** registers a slot step element (in DOM order); returns the unregister function */
	register(el: HTMLElement): () => void;
	/** 0-based index of a registered slot step (-1 = not registered yet) */
	indexOf(el: HTMLElement | undefined): number;
	/** [ext, not in original] motion of the wizard (connector fill); absent / disabled = the original rendering */
	readonly motion?: MotionHandle;
}

const KEY = Symbol('StepsGroupContext');

export const setStepsGroupContext = (value: StepsGroupContextValue): void => {
	setContext(KEY, value);
};

export const getStepsGroupContext = (): StepsGroupContextValue | undefined => getContext<StepsGroupContextValue | undefined>(KEY);
