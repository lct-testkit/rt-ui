// Counter has no constants.ts in React (values are inlined in the component / stories); kept here for the types.
export const COUNTER_VARIANTS = ['primary', 'onBackground', 'ghost'] as const;
export type CounterVariant = (typeof COUNTER_VARIANTS)[number];

export const COUNTER_COLORSCHEMES = ['accent', 'neutral'] as const;
export type CounterColorScheme = (typeof COUNTER_COLORSCHEMES)[number];

export const COUNTER_SIZES = ['s', 'xs', '2xs'] as const;
export type CounterSize = (typeof COUNTER_SIZES)[number];
