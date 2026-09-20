<script lang="ts">
	// Port of packages/ui-kit/src/components/Notifications/CustomToastNotification/CustomToastNotification.tsx
	// `children(close)` (function as children) is a snippet receiving the `close` callback; `forwardRef` is the bindable `ref` prop.
	import clsx from 'clsx';
	import type { HTMLAttributes } from 'svelte/elements';
	import Typography from '../../Typography/Typography.svelte';
	import type { MotionProp } from '../../../ext/motion.svelte.js';
	import {
		DEFAULT_ID,
		NOTIFICATION_POSITION,
		NOTIFICATION_SIZES,
		NOTIFICATION_SIZE_DEFAULT,
		NOTIFICATION_VARIANTS,
		NOTIFICATION_VARIANT_DEFAULT,
		type NotificationPosition,
		type NotificationSize,
		type NotificationVariant
	} from '../constants.js';
	import { useNotifications, useNotificationsHeight, useNotificationsStack } from '../hooks.svelte.js';
	import type { CustomToastChildren } from '../types.js';

	interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'id'> {
		/** Задаёт вариант для компонента */
		variant?: NotificationVariant;
		/** Задает размер */
		size?: NotificationSize;
		/** Задает уникальный id для компонента */
		id?: string;
		/** Задает время в миллисекундах, через которое уведомление скроется */
		timeout?: number;
		/** Callback функция, вызываемая при появлении уведомления */
		onOpen?: () => void;
		/** Задает расположение относительно всего экрана */
		position?: NotificationPosition;
		/** Контент уведомления; получает функцию закрытия */
		children?: CustomToastChildren;
		/** Корневой элемент (forwardRef) */
		ref?: HTMLDivElement | null;
		/** [ext, not in original] The motion setting of this notification; read by the ToastNotificationsProvider stack, ignored by a standalone toast. */
		motion?: MotionProp;
		/** [ext, not in original] Rendered by the extension layer's Svelte-motion stack: natural height, no class transitions, class `rt-ext-toast`. */
		extended?: boolean;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		[key: string]: any;
	}

	let {
		variant = NOTIFICATION_VARIANT_DEFAULT,
		size = NOTIFICATION_SIZE_DEFAULT,
		id = DEFAULT_ID,
		timeout,
		onOpen,
		class: className = '',
		position = NOTIFICATION_POSITION.topRight,
		children,
		ref = $bindable(null),
		motion: _motion,
		extended = false,
		...rest
	}: Props = $props();

	const notifications = useNotifications({ onOpen: () => onOpen, onClose: () => undefined });
	// [ext] an extended toast keeps its natural height (`.rt-ext-toast`)
	useNotificationsHeight(
		() => (extended ? null : ref),
		() => notifications.isOpen
	);
	const { closeNotification } = useNotificationsStack();

	const handleCloseToastNotification = () => {
		closeNotification(id);
	};

	// re-armed when timeout / id change by VALUE (see ToastNotification.svelte)
	const timeoutMs = $derived(timeout);
	const toastId = $derived(id);

	$effect(() => {
		void toastId;
		const ms = timeoutMs;
		if (ms) {
			const timer = setTimeout(handleCloseToastNotification, ms);
			return () => clearTimeout(timer);
		}
	});

	const rootClass = $derived(
		clsx(
			'atmr-custom-toast-notification',
			`atmr-custom-toast-notification--size-${NOTIFICATION_SIZES[size]}`,
			`atmr-custom-toast-notification--${NOTIFICATION_VARIANTS[variant]}`,
			`atmr-custom-toast-notification--${NOTIFICATION_POSITION[position]}`,
			`${className}`,
			extended && 'rt-ext-toast'
		)
	);
</script>

<div class={rootClass} bind:this={ref} {...rest}>
	<div class="atmr-custom-toast-notification__wrapper">
		{#if children}
			{@render children(handleCloseToastNotification)}
		{:else}
			<div class="atmr-custom-toast-notification__content">
				<Typography variant="body-m">Здесь может быть любой контент</Typography>
			</div>
		{/if}
	</div>
</div>
