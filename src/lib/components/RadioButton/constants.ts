// Port of packages/ui-kit/src/components/RadioButton/constants.ts
export const RADIOBUTTON_SIZES = { s: 's', xs: 'xs' } as const;
export type RadioButtonSize = keyof typeof RADIOBUTTON_SIZES;

export const RADIOBUTTON_VARIANTS = { primary: 'primary', secondary: 'secondary' } as const;
export type RadioButtonVariant = keyof typeof RADIOBUTTON_VARIANTS;
