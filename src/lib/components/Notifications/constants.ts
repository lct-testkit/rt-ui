// Port of packages/ui-kit/src/components/Notifications/constants.ts
// (TS enums become `as const` records, so `Object.values(NOTIFICATION_COLORSCHEMES)` etc. work like in React)
export const ICON_SIZE = 24;
export const INLINE_NOTIFICATION_TIMEOUT = 300;
export const DEFAULT_ID = '1';

export const NOTIFICATION_VARIANTS = { primary: 'primary' } as const;
export type NotificationVariant = keyof typeof NOTIFICATION_VARIANTS;

export const NOTIFICATION_SIZES = { m: 'm' } as const;
export type NotificationSize = keyof typeof NOTIFICATION_SIZES;

export const NOTIFICATION_COLORSCHEMES = {
	info: 'info',
	warning: 'warning',
	error: 'error',
	success: 'success'
} as const;
export type NotificationColorScheme = keyof typeof NOTIFICATION_COLORSCHEMES;

export const NOTIFICATION_POSITION = {
	topLeft: 'topLeft',
	topRight: 'topRight',
	topCenter: 'topCenter',
	bottomLeft: 'bottomLeft',
	bottomRight: 'bottomRight',
	bottomCenter: 'bottomCenter'
} as const;
export type NotificationPosition = keyof typeof NOTIFICATION_POSITION;

export const NOTIFICATION_COLORSCHEME_DEFAULT: NotificationColorScheme = NOTIFICATION_COLORSCHEMES.info;
export const NOTIFICATION_VARIANT_DEFAULT: NotificationVariant = NOTIFICATION_VARIANTS.primary;
export const NOTIFICATION_SIZE_DEFAULT: NotificationSize = NOTIFICATION_SIZES.m;
