// Port of packages/ui-kit/src/components/Popover/constants.ts
import { PLACEMENTS } from '../../hooks/usePopper/constants.js';

export const TRIGGERS = {
	click: 'click',
	hover: 'hover'
} as const;
export type PopoverTrigger = (typeof TRIGGERS)[keyof typeof TRIGGERS];

export const POPOVER_SIZES = {
	m: 'm'
} as const;
export type PopoverSize = (typeof POPOVER_SIZES)[keyof typeof POPOVER_SIZES];

export const POPOVER_VARIANTS = {
	primary: 'primary'
} as const;
export type PopoverVariant = (typeof POPOVER_VARIANTS)[keyof typeof POPOVER_VARIANTS];

/** Extra distance (px) added to the pointer height when computing the default offset. */
export const ADDITIONAL_OFFSET = 4;

export const DEFAULT_SIZE: PopoverSize = POPOVER_SIZES.m;
export const DEFAULT_PLACEMENT = PLACEMENTS.auto;
export const DEFAULT_TRIGGER: PopoverTrigger = TRIGGERS.click;
export const DEFAULT_VARIANT: PopoverVariant = POPOVER_VARIANTS.primary;
