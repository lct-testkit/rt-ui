// Port of packages/ui-kit/src/components/Switch/constants.ts
export const SWITCH_SIZES = { xs: 'xs', s: 's' } as const;
export type SwitchSize = keyof typeof SWITCH_SIZES;

export const SWITCH_VARIANTS = { primary: 'primary' } as const;
export type SwitchVariant = keyof typeof SWITCH_VARIANTS;

export const SWITCH_LABEL_POSITION = { left: 'left', right: 'right' } as const;
export type SwitchLabelPosition = keyof typeof SWITCH_LABEL_POSITION;

export interface TouchPosition {
	start: number | null;
	end: number | null;
}

export const DEFAULT_TOUCH_POSITION: TouchPosition = { start: null, end: null };
