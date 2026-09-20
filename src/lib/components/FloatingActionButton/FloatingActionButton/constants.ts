// Port of packages/ui-kit/src/components/FloatingActionButton/FloatingActionButton/constants.ts
export const FLOATING_ACTION_BUTTON_VARIANTS = ['primary', 'secondary'] as const;
export type FloatingActionButtonVariant = (typeof FLOATING_ACTION_BUTTON_VARIANTS)[number];

export const FLOATING_ACTION_BUTTON_SIZES = ['l'] as const;
export type FloatingActionButtonSize = (typeof FLOATING_ACTION_BUTTON_SIZES)[number];

export const DEFAULT_ICON_POSIION = 'left';
export const DEFAULT_VARIANT: FloatingActionButtonVariant = 'primary';
export const DEFAULT_SIZE: FloatingActionButtonSize = 'l';
