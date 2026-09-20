// Port of packages/ui-kit/src/components/InputNumberStepper/constants.ts (TS enums become const objects + string unions).
// (the source of this module only exists inside the stories bundle of the React storybook)

export const DEFAULT_VALUE = 0;
export const DEFAULT_STEP = 1;
export const DEFAULT_DISABLED_STATE = {
	isAllDisabled: false,
	isLeftDisabled: false,
	isRightDisabled: false
};
export const NUMBER_STEPPER_VAL_MAX_LENGTH = 20;
export const MAX_LENGTH_FOR_CORRECT_DISPLAY_VAL = 13;

export const NUMBER_STEPPER_DISABLED = {
	all: 'all',
	left: 'left',
	right: 'right'
} as const;
export type NumberStepperDisabled = (typeof NUMBER_STEPPER_DISABLED)[keyof typeof NUMBER_STEPPER_DISABLED];

export const NUMBER_STEPPER_SIZES = {
	m: 'm',
	l: 'l'
} as const;
export type NumberStepperSize = (typeof NUMBER_STEPPER_SIZES)[keyof typeof NUMBER_STEPPER_SIZES];

export const NUMBER_STEPPER_VARIANTS = {
	primary: 'primary'
} as const;
export type NumberStepperVariant = (typeof NUMBER_STEPPER_VARIANTS)[keyof typeof NUMBER_STEPPER_VARIANTS];

export const DEFAULT_SIZE: NumberStepperSize = NUMBER_STEPPER_SIZES.m;
export const DEFAULT_VARIANT: NumberStepperVariant = NUMBER_STEPPER_VARIANTS.primary;
