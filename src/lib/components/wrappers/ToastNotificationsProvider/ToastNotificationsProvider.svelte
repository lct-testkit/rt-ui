<script lang="ts" module>
	// React: `const portalDiv = typeof window !== 'undefined' ? document.createElement('div') : null;` - ONE div shared by every provider.
	const portalDiv: HTMLDivElement | null = typeof window !== 'undefined' ? document.createElement('div') : null;
</script>

<script lang="ts">
	// Port of packages/ui-kit/src/components/wrappers/ToastNotificationsProvider/ToastNotificationsProvider.tsx
	//
	//   <ToastNotificationsProvider position="topRight" maxCount={3}> ...app... </ToastNotificationsProvider>
	//
	// Provides the notification stack (`addNotification`, `addCustomNotification`, `closeNotification`, `closeAllNotifications`,
	// `getNotificationId`) through the NotificationsStackContext (read it with `useNotificationsStack()` from
	// Notifications/hooks.svelte.ts) and renders the toast container. With `useInPortal` (default) the container lives in the shared
	// `portalDiv`, which is appended to <body> in an effect (so it comes AFTER portals that the children created while mounting) and
	// removed again when the provider is destroyed - exactly what React does. Without a portal the container follows the children.
	import type { Snippet } from 'svelte';
	import { NOTIFICATION_POSITION, type NotificationPosition } from '../../Notifications/constants.js';
	import type { CSSTransitionConfig } from '../../Notifications/_transition.svelte.js';
	import type { MotionProp } from '../../../ext/motion.svelte.js';
	import { setNotificationsStack, type NotificationData } from './NotificationsStackContext.js';
	import ToastNotifications, { type StoredNotification, type TransitionGroupProps } from './ToastNotifications.svelte';

	interface Props {
		children?: Snippet;
		/** Задает максимальное количество уведомлений */
		maxCount?: number;
		/** Задает расположение относительно всего экрана */
		position?: NotificationPosition;
		/** Задает использование в Portal */
		useInPortal?: boolean;
		/** Задает параметры для CSSTransition (https://reactcommunity.org/react-transition-group) */
		cssTransitionProps?: CSSTransitionConfig;
		/** Задает параметры для TransitionGroup (https://reactcommunity.org/react-transition-group) */
		transitionGroupProps?: TransitionGroupProps;
		/**
		 * [ext, not in original] Svelte-native motion of the stack: toasts fly in from the side of `position`, fly back out (+ fade) and the rest of
		 * the stack glides (`animate:flip`). `undefined` (default) inherits `ExtMotionProvider` (mode 'svelte' / `overrides.toast`) and is OFF without
		 * one = the original markup and behaviour. A notification's own `motion` (`addNotification({ ..., motion })`) wins over this.
		 * `prefers-reduced-motion: reduce` disables the animation in every case.
		 */
		motion?: MotionProp;
	}

	let {
		children,
		maxCount = 3,
		position = NOTIFICATION_POSITION.topRight,
		useInPortal = true,
		cssTransitionProps = {},
		transitionGroupProps = {},
		motion
	}: Props = $props();

	let notifications = $state.raw<StoredNotification[]>([]);

	// hooks/useIdGenerator: ids 1..maxCount+1, the counter is reset once it has passed `maxCount`
	let idCounter = $state(0);
	$effect(() => {
		if (maxCount && idCounter > maxCount) idCounter = 0;
	});
	const generateNewId = () => {
		const newId = idCounter + 1;
		idCounter = newId;
		return newId;
	};

	function addNotification({ content: _content, ...props }: NotificationData, isCustom?: boolean) {
		const last = props?.id ?? generateNewId().toString();
		const newNotes: StoredNotification[] = [...notifications.filter(({ id }) => id !== last), { ...props, id: last, isCustom }];
		if (newNotes.length > maxCount) newNotes.shift();
		notifications = newNotes;
	}

	setNotificationsStack({
		addCustomNotification: (props) => addNotification(props, true),
		addNotification,
		closeNotification: (closeId) => {
			notifications = notifications.filter((note) => note.id !== closeId);
		},
		closeAllNotifications: () => {
			notifications = [];
		},
		getNotificationId: () => notifications.map((note) => note.id)
	});

	$effect(() => {
		if (portalDiv && useInPortal) document.body.appendChild(portalDiv);
		return () => {
			if (portalDiv && document.body.contains(portalDiv)) document.body.removeChild(portalDiv);
		};
	});
</script>

{@render children?.()}
<ToastNotifications {position} {notifications} {cssTransitionProps} {transitionGroupProps} portalTarget={useInPortal ? portalDiv : null} {motion} />
