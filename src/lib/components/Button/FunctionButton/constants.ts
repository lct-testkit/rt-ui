// Port of packages/ui-kit/src/components/Button/FunctionButton/constants.ts
export const FUNCTION_BUTTON_SIZES = ['s'] as const;
export type FunctionButtonSize = (typeof FUNCTION_BUTTON_SIZES)[number];

export const FUNCTION_BUTTON_VARIANTS = ['primary', 'secondary', 'tertiary'] as const;
export type FunctionButtonVariant = (typeof FUNCTION_BUTTON_VARIANTS)[number];

export const ICON_POSITIONS = ['left', 'right'] as const;
export type IconPosition = (typeof ICON_POSITIONS)[number];

export const DEFAULT_SIZE: FunctionButtonSize = 's';
export const DEFAULT_VARIANT: FunctionButtonVariant = 'primary';
