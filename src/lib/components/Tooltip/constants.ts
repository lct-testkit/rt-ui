// Port of packages/ui-kit/src/components/Tooltip/constants.ts
import { PLACEMENTS } from '../../hooks/usePopper/constants.js';

export const TRIGGERS = {
	click: 'click',
	hover: 'hover'
} as const;
export type TooltipTrigger = (typeof TRIGGERS)[keyof typeof TRIGGERS];

export const TOOLTIP_SIZES = {
	s: 's'
} as const;
/** `'m'` is a legacy value: it is mapped to `'s'` (with a console warning), like in React. */
export type TooltipSize = (typeof TOOLTIP_SIZES)[keyof typeof TOOLTIP_SIZES] | 'm';

export const TOOLTIP_VARIANTS = {
	primary: 'primary'
} as const;
export type TooltipVariant = (typeof TOOLTIP_VARIANTS)[keyof typeof TOOLTIP_VARIANTS];

/** Extra distance (px) added to the pointer height when computing the default offset. */
export const ADDITIONAL_OFFSET = 4;

export const DEFAULT_TRIGGER: TooltipTrigger = TRIGGERS.hover;
export const DEFAULT_SIZE = TOOLTIP_SIZES.s;
export const DEFAULT_VARIANT: TooltipVariant = TOOLTIP_VARIANTS.primary;
export const DEFAULT_PLACEMENT = PLACEMENTS.auto;
