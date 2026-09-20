// Port of packages/ui-kit/src/components/Checkbox/constants.ts (TS enums become const objects; `Object.values` keeps the order)
export const CHECKBOX_SIZES = { xs: 'xs', s: 's' } as const;
export type CheckboxSize = keyof typeof CHECKBOX_SIZES;

export const CHECKBOX_VARIANTS = { primary: 'primary' } as const;
export type CheckboxVariant = keyof typeof CHECKBOX_VARIANTS;
