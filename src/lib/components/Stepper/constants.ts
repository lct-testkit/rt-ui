// Port of packages/ui-kit/src/components/Stepper/constants.ts
export const STEPPER_DISABLED = ['all', 'left', 'right'] as const;
export type StepperDisabled = (typeof STEPPER_DISABLED)[number];

export const STEPPER_SIZES = ['m', 'l'] as const;
export type StepperSize = (typeof STEPPER_SIZES)[number];

export const STEPPER_VARIANTS = ['primary', 'secondary'] as const;
export type StepperVariant = (typeof STEPPER_VARIANTS)[number];

export const STEPPER_WIDTH_LIST: Record<StepperSize, number> = { l: 96, m: 80 };
export const STEPPER_HEIGHT_LIST: Record<StepperSize, number> = { l: 48, m: 32 };

export const STEPPER_VARIANT_DEFAULT: StepperVariant = 'primary';
export const STEPPER_SIZE_DEFAULT: StepperSize = 'm';
