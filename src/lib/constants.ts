// Port of packages/ui-kit/src/constants/components.ts (enums become string unions + value lists).
export const SIZES = ['s', 'm', 'l', 'xl'] as const;
export type Size = (typeof SIZES)[number];

export const COLORSCHEME = ['accent', 'neutral'] as const;
export type ColorScheme = (typeof COLORSCHEME)[number];

export const VARIANT = ['primary', 'secondary', 'outline', 'ghost'] as const;
export type Variant = (typeof VARIANT)[number];

export const SYSTEM_COLORS = ['info', 'warning', 'error', 'success'] as const;
export type SystemColor = (typeof SYSTEM_COLORS)[number];
