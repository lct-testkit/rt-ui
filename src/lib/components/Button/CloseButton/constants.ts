// Port of packages/ui-kit/src/components/Button/CloseButton/constants.tsx
// (the React `generateIcon` lives in CloseButton.svelte because Svelte icons are components, not elements)
export const CLOSE_BUTTON_SIZES = ['2xs', 'xs', 's', 'm', 'l'] as const;
export type CloseButtonSize = (typeof CLOSE_BUTTON_SIZES)[number];

export const CLOSE_BUTTON_VARIANTS = ['primary'] as const;
export type CloseButtonVariant = (typeof CLOSE_BUTTON_VARIANTS)[number];
