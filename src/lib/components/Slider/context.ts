// Port of packages/ui-kit/src/components/Slider/SliderContext.ts (React createContext -> Svelte context).
import { getContext, setContext } from 'svelte';
import type { SliderMark, SliderTick } from './hooks.svelte.js';

/** What the Slider shares with its track and thumbs (getters: values are reactive). */
export interface SliderContextValue {
	readonly isReversed: boolean;
	readonly parsedTicks: SliderTick[];
	readonly marks?: SliderMark[];
	readonly dots?: boolean;
	readonly min: number;
	readonly max: number;
	readonly step: number;
	readonly disabled?: boolean;
	roundValue: (value: number | string) => number;
}

const KEY = Symbol('atmr-slider-context');

export const setSliderContext = (value: SliderContextValue): void => {
	setContext(KEY, value);
};

export const getSliderContext = (): SliderContextValue => getContext<SliderContextValue>(KEY);
