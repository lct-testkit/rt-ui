// Port of packages/ui-kit/src/components/Slider/constants.ts (TS enums become const objects + string unions).
// (the source of this module only exists inside the stories bundle of the React storybook)

export const SLIDER_SIZES = {
	m: 'm'
} as const;
export type SliderSize = (typeof SLIDER_SIZES)[keyof typeof SLIDER_SIZES];

export const SLIDER_VARIANTS = {
	primary: 'primary'
} as const;
export type SliderVariant = (typeof SLIDER_VARIANTS)[keyof typeof SLIDER_VARIANTS];

export const ADDITIONAL_OFFSET = 4;
export const DEFAULT_SIZE: SliderSize = SLIDER_SIZES.m;
export const DEFAULT_VARIANT: SliderVariant = SLIDER_VARIANTS.primary;
