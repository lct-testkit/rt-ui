// Port of packages/ui-kit/src/components/wrappers/ToastNotificationsProvider/NotificationsStackContext.ts
// React: createContext({...noop stack}) consumed through `useNotificationsStack()`.
// Svelte: the provider calls `setContext(NOTIFICATIONS_STACK_CONTEXT, stack)`, `useNotificationsStack()` (Notifications/hooks.svelte.ts)
// reads it with `getContext`. Outside a provider the default (noop) stack is returned, like the React default value.
import { getContext, setContext } from 'svelte';

/** Props of a notification as passed to `addNotification` (`content` is dropped, the rest goes to the component). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type NotificationData = { id?: string; content?: unknown; [key: string]: any };

export interface NotificationsStack {
	addCustomNotification: (props: NotificationData) => void;
	addNotification: (props: NotificationData, isCustom?: boolean) => void;
	closeNotification: (id: string) => void;
	closeAllNotifications: () => void;
	getNotificationId: () => string[];
}

export const defaultNotificationsStack: NotificationsStack = {
	addCustomNotification() {},
	addNotification() {},
	closeNotification() {},
	closeAllNotifications() {},
	getNotificationId() {
		return [];
	}
};

export const NOTIFICATIONS_STACK_CONTEXT = Symbol('NotificationsStackContext');

export const setNotificationsStack = (stack: NotificationsStack): NotificationsStack => setContext(NOTIFICATIONS_STACK_CONTEXT, stack);

export const getNotificationsStack = (): NotificationsStack => getContext<NotificationsStack | undefined>(NOTIFICATIONS_STACK_CONTEXT) ?? defaultNotificationsStack;
