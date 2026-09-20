<script lang="ts">
	// Port of CustomInlineNotification (packages/ui-kit/src/components/Notifications/CustomInlineNotification/CustomInlineNotification.tsx)
	// rendered inside a react-transition-group CSSTransition (`atmr-custom-inline-notifications-*`, 300 ms, mountOnEnter/unmountOnExit);
	// `in` is `isOpened` (default true), so it is mounted already entered (no transition classes) and only animates when `isOpened` toggles.
	import clsx from 'clsx';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import Typography from '../../Typography/Typography.svelte';
	import { CSSTransition, type CSSTransitionConfig } from '../_transition.svelte.js';
	import {
		INLINE_NOTIFICATION_TIMEOUT,
		NOTIFICATION_SIZES,
		NOTIFICATION_SIZE_DEFAULT,
		NOTIFICATION_VARIANTS,
		NOTIFICATION_VARIANT_DEFAULT,
		type NotificationSize,
		type NotificationVariant
	} from '../constants.js';

	interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
		/** Задаёт вариант для компонента */
		variant?: NotificationVariant;
		/** Задает размер */
		size?: NotificationSize;
		/** Задает состояние отображения */
		isOpened?: boolean;
		/** Контент уведомления */
		children?: Snippet;
		/** Параметры для CSSTransition (https://reactcommunity.org/react-transition-group) */
		transitionProps?: CSSTransitionConfig;
		/** Корневой элемент */
		ref?: HTMLDivElement | null;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		[key: string]: any;
	}

	let {
		variant = NOTIFICATION_VARIANT_DEFAULT,
		size = NOTIFICATION_SIZE_DEFAULT,
		isOpened = true,
		class: className = '',
		children,
		transitionProps = {},
		ref = $bindable(null),
		...rest
	}: Props = $props();

	const transition = new CSSTransition(
		() => isOpened,
		() => ({
			classNames: 'atmr-custom-inline-notifications',
			timeout: INLINE_NOTIFICATION_TIMEOUT,
			mountOnEnter: true,
			unmountOnExit: true,
			...transitionProps
		}),
		() => ref
	);

	const rootClass = $derived(
		clsx(
			'atmr-custom-inline-notification',
			`atmr-custom-inline-notification--size-${NOTIFICATION_SIZES[size]}`,
			`atmr-custom-inline-notification--${NOTIFICATION_VARIANTS[variant]}`,
			`${className}`
		)
	);
</script>

{#if transition.status !== 'unmounted'}
	<div class={rootClass} bind:this={ref} {...rest}>
		{#if children}
			{@render children()}
		{:else}
			<Typography variant="body-m">Здесь может быть любой контент</Typography>
		{/if}
	</div>
{/if}
