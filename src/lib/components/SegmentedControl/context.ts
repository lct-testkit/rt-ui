// Port of packages/ui-kit/src/components/SegmentedControl/context.ts (React context -> Svelte context).
import { getContext, setContext } from 'svelte';
import type { SegmentedControlSize, SegmentedControlVariant } from './constants.js';

export interface SegmentedControlContextValue {
	variant?: SegmentedControlVariant;
	size?: SegmentedControlSize;
	disabledAll?: boolean;
	activeIndex?: string;
	handleChange?: (index: string) => void;
}

const SEGMENTED_CONTROL_CONTEXT_KEY = Symbol('SegmentedControlContext');

/** `SegmentedControlContextProvider` */
export const setSegmentedControlContext = (value: SegmentedControlContextValue): SegmentedControlContextValue =>
	setContext(SEGMENTED_CONTROL_CONTEXT_KEY, value);

/** `useContext(SegmentedControlContext)` (React default value is `{}`) */
export const getSegmentedControlContext = (): SegmentedControlContextValue =>
	getContext<SegmentedControlContextValue | undefined>(SEGMENTED_CONTROL_CONTEXT_KEY) ?? {};
