// Port of packages/ui-kit/src/components/SegmentedControl/constants.ts
export const SEGMENTED_CONTROL_SIZES = { l: 'l', m: 'm', s: 's' } as const;
export type SegmentedControlSize = keyof typeof SEGMENTED_CONTROL_SIZES;

export const SEGMENTED_CONTROL_VARIANTS = { primary: 'primary', secondary: 'secondary' } as const;
export type SegmentedControlVariant = keyof typeof SEGMENTED_CONTROL_VARIANTS;

export const DEFAULT_SIZE: SegmentedControlSize = SEGMENTED_CONTROL_SIZES.m;
export const DEFAULT_VARIANT: SegmentedControlVariant = SEGMENTED_CONTROL_VARIANTS.primary;
