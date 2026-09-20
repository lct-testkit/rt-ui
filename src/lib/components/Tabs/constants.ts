// Port of packages/ui-kit/src/components/Tabs/constants.ts (enums become const maps).
export const TABS_ICON_POSITIONS = {
	top: 'top',
	left: 'left',
	right: 'right'
} as const;
export type TabsIconPosition = (typeof TABS_ICON_POSITIONS)[keyof typeof TABS_ICON_POSITIONS];

export const TABS_SIZES = {
	m: 'm',
	s: 's'
} as const;
export type TabsSize = (typeof TABS_SIZES)[keyof typeof TABS_SIZES];

export const TABS_VARIANTS = {
	primary: 'primary'
} as const;
export type TabsVariant = (typeof TABS_VARIANTS)[keyof typeof TABS_VARIANTS];

export const DEFAULT_TAB_VARIANT: TabsVariant = TABS_VARIANTS.primary;
export const DEFAULT_TAB_SIZE: TabsSize = TABS_SIZES.m;
