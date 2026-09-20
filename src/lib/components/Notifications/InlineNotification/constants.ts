// Port of packages/ui-kit/src/components/Notifications/InlineNotification/constants.ts
import type { Component } from 'svelte';
import ErrorColor from '../icons/ErrorColor.svelte';
import InformationColor from '../icons/InformationColor.svelte';
import OkColor from '../icons/OkColor.svelte';
import AttentionColor from '../icons/AttentionColor.svelte';
import { NOTIFICATION_COLORSCHEMES, type NotificationColorScheme } from '../constants.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const INLINE_ICON_COMPONENT: Record<NotificationColorScheme, Component<any>> = {
	[NOTIFICATION_COLORSCHEMES.error]: ErrorColor,
	[NOTIFICATION_COLORSCHEMES.info]: InformationColor,
	[NOTIFICATION_COLORSCHEMES.success]: OkColor,
	[NOTIFICATION_COLORSCHEMES.warning]: AttentionColor
};
