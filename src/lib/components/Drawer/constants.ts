// Port of packages/ui-kit/src/components/Drawer/constats.ts (`DRAWER_POSITION` TS enum -> `as const` record)
export const DRAWER_POSITION = {
	top: 'top',
	right: 'right',
	bottom: 'bottom',
	left: 'left'
} as const;
export type DrawerPosition = (typeof DRAWER_POSITION)[keyof typeof DRAWER_POSITION];
