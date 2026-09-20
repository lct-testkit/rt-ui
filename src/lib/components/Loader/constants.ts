// Port of packages/ui-kit/src/components/Loader/constants.ts
export const LOADER_SIZES = ['2xs', 's', 'm'] as const;
export type LoaderSize = (typeof LOADER_SIZES)[number];

export const LOADER_VIEW = ['primary', 'secondary'] as const;
export type LoaderVariant = (typeof LOADER_VIEW)[number];

export const LOADER_TYPES = ['default', 'spinner', 'spinnerBg', 'dots'] as const;
/** `spinner` and `dots` are deprecated by the design team, kept for parity */
export type LoaderType = (typeof LOADER_TYPES)[number];
