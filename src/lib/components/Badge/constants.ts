// Port of packages/ui-kit/src/components/Badge/constants.ts
import type { SystemColor } from '../../constants.js';

export const BADGE_SIZES = ['2xs', 's'] as const;
export type BadgeSize = (typeof BADGE_SIZES)[number];

export const BADGE_VARIANTS = ['primary', 'secondary'] as const;
export type BadgeVariant = (typeof BADGE_VARIANTS)[number];

export const BADGE_COLORSCHEME = ['neutral', 'status-01', 'status-02', 'status-03', 'status-04', 'status-05', 'status-06'] as const;
export type BadgeStatusColor = (typeof BADGE_COLORSCHEME)[number];
/** SYSTEM_COLORS + BADGE_COLORSCHEME */
export type BadgeColorScheme = SystemColor | BadgeStatusColor;

export const DEFAULT_BADGE_VARIANT: BadgeVariant = 'primary';
export const DEFAULT_BADGE_SIZE: BadgeSize = '2xs';
export const DEFAULT_BADGE_COLORSCHEME: BadgeColorScheme = 'info';
