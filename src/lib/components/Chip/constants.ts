// Port of packages/ui-kit/src/components/Chip/constants.ts
export const CHIP_VARIANTS = { primary: 'primary', secondary: 'secondary' } as const;
export type ChipVariant = keyof typeof CHIP_VARIANTS;

export const CHIP_SIZES = { m: 'm', s: 's' } as const;
export type ChipSize = keyof typeof CHIP_SIZES;

export const DEFAULT_CHIP_TOTAL_LABEL = 'Все';
