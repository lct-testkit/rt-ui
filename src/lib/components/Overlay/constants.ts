// Port of packages/ui-kit/src/components/Overlay/constants.ts
export const OVERLAY_VARIANTS = ['primary', 'secondary'] as const;
export type OverlayVariant = (typeof OVERLAY_VARIANTS)[number];

export const DEFAULT_VARIANT: OverlayVariant = 'primary';
