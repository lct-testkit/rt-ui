import type { Snippet } from 'svelte';
import type { Content } from '../../internal/types.js';
import type { FunctionButtonSize, FunctionButtonVariant, IconPosition } from '../Button/FunctionButton/constants.js';

/** Props of one action button of a notification (`INotificationButton`): FunctionButton props + `action(id)`. */
export interface NotificationButtonProps {
	/** Callback вызывается при клике на кнопку, получает id уведомления */
	action: (id: string) => void;
	label?: Content;
	icon?: Content;
	iconPosition?: IconPosition;
	variant?: FunctionButtonVariant;
	size?: FunctionButtonSize;
	disabled?: boolean;
	class?: string;
	[key: string]: unknown;
}

/** Custom toast children: `children(close)` in React, a snippet receiving the `close` callback in Svelte. */
export type CustomToastChildren = Snippet<[() => void]>;
