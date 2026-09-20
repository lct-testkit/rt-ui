<script lang="ts">
	// One `<CSSTransition key mountOnEnter unmountOnExit timeout={300} classNames="atmr-toast-notification" nodeRef>` child of the
	// ToastNotifications `TransitionGroup` (see ToastNotifications.tsx): the toast itself is rendered while the transition is not
	// `unmounted`, `enter` -> `enter-active` -> (300 ms) -> `enter-done`, and after the leave (`in` = false) `exit` -> `exit-active` ->
	// (300 ms) -> `exit-done` -> unmounted; the group is told about the end of the exit (`TransitionGroup.handleExited`).
	import { CSSTransition, type CSSTransitionConfig, type TransitionGroupContext } from '../../Notifications/_transition.svelte.js';
	import CustomToastNotification from '../../Notifications/CustomToastNotification/CustomToastNotification.svelte';
	import ToastNotification from '../../Notifications/ToastNotification/ToastNotification.svelte';
	import type { NotificationData } from './NotificationsStackContext.js';

	interface Props {
		/** Notification props (`content` / `isCustom` already removed) */
		notification: NotificationData & { id: string };
		isCustom?: boolean;
		/** `in` prop given by the TransitionGroup */
		isIn: boolean;
		/** `enter` / `exit` given by the TransitionGroup props (they win over `cssTransitionProps`) */
		enter?: boolean | null;
		exit?: boolean | null;
		cssTransitionProps?: CSSTransitionConfig;
		group: TransitionGroupContext;
		/** TransitionGroup `handleExited(child)` */
		onExited: (key: string) => void;
	}

	let { notification, isCustom = false, isIn, enter, exit, cssTransitionProps = {}, group, onExited }: Props = $props();

	let el = $state<HTMLDivElement | null>(null);

	const transition = new CSSTransition(
		() => isIn,
		() => ({
			mountOnEnter: true,
			unmountOnExit: true,
			timeout: 300,
			classNames: 'atmr-toast-notification',
			...cssTransitionProps,
			enter: enter ?? cssTransitionProps.enter,
			exit: exit ?? cssTransitionProps.exit,
			// TransitionGroup.handleExited: the child's own `onExited` first, then the child leaves the group state
			onExited: (node, ...rest) => {
				cssTransitionProps.onExited?.(node, ...rest);
				onExited(notification.id);
			}
		}),
		() => el,
		{
			get isMounting() {
				return group.isMounting;
			}
		}
	);
</script>

{#if transition.status !== 'unmounted'}
	{#if isCustom}
		<CustomToastNotification bind:ref={el} {...notification} />
	{:else}
		<ToastNotification bind:ref={el} {...notification} />
	{/if}
{/if}
