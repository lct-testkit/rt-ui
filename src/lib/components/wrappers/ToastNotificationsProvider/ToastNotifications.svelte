<script lang="ts">
	// Port of packages/ui-kit/src/components/wrappers/ToastNotificationsProvider/ToastNotifications.tsx
	//
	//   <div class="atmr-toast-notification-container atmr-toast-notification-container--{position}">
	//     <TransitionGroup component={null} {...transitionGroupProps}>
	//       {notifications.map(n => <CSSTransition key={n.id} mountOnEnter unmountOnExit timeout={300} classNames="atmr-toast-notification" {...cssTransitionProps}>...toast</CSSTransition>)}
	//     </TransitionGroup>
	//   </div>
	//
	// `TransitionGroup` (react-transition-group 4.4.5, `component={null}`) is reproduced here: the children state is derived from the
	// `notifications` prop (`getNextChildMapping`): new keys enter (`in`), keys that disappeared stay rendered with `in = false` until their exit
	// transition has finished (`handleExited`). The transition of one child lives in ToastTransitionItem.svelte.
	// `portalTarget` = the shared `portalDiv` of the provider when `useInPortal` (`createPortal(toastNotifications, portalDiv)`).
	//
	// [ext, not in original] With the author's motion extension switched on for toasts (`motion` here, `motion` of a notification, or an
	// ExtMotionProvider with mode 'svelte' / `overrides.toast`) the container renders the toasts through Svelte transitions instead of the
	// react-transition-group emulation: `in:` fly from the side of `position` + fade, `out:` fly back + fade, `animate:` flip for the rest of the
	// stack (see src/lib/ext/toastMotion.ts). Every toast is then wrapped in `div.rt-ext-toast-item` and rendered `extended` (natural height,
	// no class transitions). With the extension off (the default) NOTHING of this runs and the markup is exactly the original one.
	import clsx from 'clsx';
	import { onMount, untrack } from 'svelte';
	import { portal } from '../../../actions/portal.js';
	import { NOTIFICATION_POSITION, type NotificationPosition } from '../../Notifications/constants.js';
	import { mergeChildKeys, type CSSTransitionConfig } from '../../Notifications/_transition.svelte.js';
	import type { NotificationData } from './NotificationsStackContext.js';
	import ToastTransitionItem from './ToastTransitionItem.svelte';
	import CustomToastNotification from '../../Notifications/CustomToastNotification/CustomToastNotification.svelte';
	import ToastNotification from '../../Notifications/ToastNotification/ToastNotification.svelte';
	import { getMotionContext, prefersReducedMotion, resolveMotion, type MotionProp } from '../../../ext/motion.svelte.js';
	import { toastFlyOffset } from '../../../ext/toastMotion.js';
	import { rtFlip, rtFly } from '../../../ext/transitions.js';

	/** Props of react-transition-group's `TransitionGroup` the provider forwards (`transitionGroupProps`). */
	export interface TransitionGroupProps {
		appear?: boolean;
		enter?: boolean;
		exit?: boolean;
		[key: string]: unknown;
	}

	/** A notification stored by the provider (`{ ...props, id, isCustom }`). */
	export type StoredNotification = NotificationData & { id: string; isCustom?: boolean };

	interface Props {
		position: NotificationPosition;
		notifications: StoredNotification[];
		cssTransitionProps?: CSSTransitionConfig;
		transitionGroupProps?: TransitionGroupProps;
		/** shared portal div of the provider (`useInPortal`) or nothing (rendered in place) */
		portalTarget?: HTMLElement | null;
		/** [ext, not in original] Svelte motion of the stack (see the file header); `undefined` = inherit from ExtMotionProvider, off without one. */
		motion?: MotionProp;
	}

	let { position, notifications, cssTransitionProps = {}, transitionGroupProps = {}, portalTarget = null, motion }: Props = $props();

	/** A child of the group: `notification` = the props given to the toast (without `isCustom`), `stored` = the object in `notifications`. */
	interface Entry {
		key: string;
		stored: StoredNotification;
		notification: NotificationData & { id: string };
		isCustom: boolean;
		isIn: boolean;
	}

	const makeEntry = (stored: StoredNotification, isIn: boolean): Entry => {
		const { isCustom, ...notification } = stored;
		return { key: stored.id, stored, notification, isCustom: !!isCustom, isIn };
	};

	// TransitionGroupContext: `isMounting` is true until the group has mounted (all enters of the initial children are "appear"s)
	let isMounting = $state(true);
	const group = {
		get isMounting() {
			return isMounting;
		}
	};
	onMount(() => {
		isMounting = false;
	});

	const rootClass = $derived(clsx('atmr-toast-notification-container', `atmr-toast-notification-container--${NOTIFICATION_POSITION[position]}`));

	/** `getInitialChildMapping` / `getNextChildMapping` of TransitionGroup on keyed notifications. */
	function deriveEntries(next: StoredNotification[], prev: Entry[]): Entry[] {
		const nextByKey = new Map(next.map((n) => [n.id, n]));
		const prevByKey = new Map(prev.map((e) => [e.key, e]));
		return mergeChildKeys(
			prev.map((e) => e.key),
			next.map((n) => n.id)
		).map((key): Entry => {
			const n = nextByKey.get(key);
			const p = prevByKey.get(key);
			const isLeaving = !!p && !p.isIn;
			if (n && (!p || isLeaving)) return makeEntry(n, true); // item is new (entering)
			if (!n && p && !isLeaving) return { ...p, isIn: false }; // item is old (exiting)
			if (n && p) return p.stored === n ? p : makeEntry(n, p.isIn); // item hasn't changed transition states
			return p as Entry; // already leaving
		});
	}

	// [ext, not in original] a notification's own `motion` > the provider's `motion` > ExtMotionProvider (kind 'toast') > off
	const motionContext = getMotionContext();
	const requestedFor = (n: StoredNotification) => resolveMotion((n.motion as MotionProp) ?? motion, 'toast', motionContext) !== null;
	/** the extension renders the stack (structure); each toast then animates only when `enabledFor` (prefers-reduced-motion: no animation) */
	const extActive = $derived(resolveMotion(motion, 'toast', motionContext) !== null || notifications.some(requestedFor));
	const enabledFor = (n: StoredNotification) => requestedFor(n) && !prefersReducedMotion();
	const flyOffset = $derived(toastFlyOffset(position));

	let entries = $state.raw<Entry[]>(untrack(() => deriveEntries(notifications, [])));
	let first = true;
	$effect.pre(() => {
		const next = notifications;
		const ext = extActive;
		if (first) {
			first = false;
			return;
		}
		// while the extension renders the stack nobody reports exits: keep the original group state free of leaving children
		untrack(() => (entries = ext ? next.map((n) => makeEntry(n, true)) : deriveEntries(next, entries)));
	});

	const extNotifications = $derived(extActive ? notifications : []);
	const originalEntries = $derived(extActive ? [] : entries);

	/** TransitionGroup.handleExited: an exited child that is not in the current children leaves the state. */
	function handleExited(key: string) {
		if (notifications.some((n) => n.id === key)) return;
		entries = entries.filter((e) => e.key !== key);
	}

	/** `createPortal(x, portalDiv)`: the container is moved into the shared portal div while `portalTarget` is set. */
	function maybePortal(node: HTMLElement, target: HTMLElement | null) {
		const instance = target ? portal(node, { target }) : undefined;
		return {
			destroy() {
				instance?.destroy?.();
			}
		};
	}
</script>

<div class={rootClass} use:maybePortal={portalTarget}>
	<!-- [ext, not in original] Svelte-native motion: fly in from the side of `position`, fly back out + fade, flip for the rest of the stack.
	     (Both lists are top-level blocks of the container, so a toast that switches the container to the extension still gets its `in:`.) -->
	{#each extNotifications as n (n.id)}
		{@const { isCustom, motion: _motion, ...notification } = n}
		{@const on = enabledFor(n)}
		<div
			class="rt-ext-toast-item"
			animate:rtFlip={{ enabled: on }}
			in:rtFly={{ enabled: on, x: flyOffset.x, y: flyOffset.y, duration: 'm', easing: 'expressive-entrance' }}
			out:rtFly={{ enabled: on, x: flyOffset.x, y: flyOffset.y, duration: 's', easing: 'expressive-exit' }}
		>
			{#if isCustom}
				<CustomToastNotification extended {...notification} />
			{:else}
				<ToastNotification extended {...notification} />
			{/if}
		</div>
	{/each}
	{#each originalEntries as entry (entry.key)}
		<ToastTransitionItem
			notification={entry.notification}
			isCustom={entry.isCustom}
			isIn={entry.isIn}
			enter={transitionGroupProps.enter}
			exit={transitionGroupProps.exit}
			{cssTransitionProps}
			{group}
			onExited={handleExited}
		/>
	{/each}
</div>
