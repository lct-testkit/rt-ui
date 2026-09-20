<script lang="ts">
	// Port of packages/ui-kit/src/components/Notifications/ToastNotification/ToastNotification.tsx
	// The React `forwardRef` (the ref of the root, used by the ToastNotificationsProvider transition) is the bindable `ref` prop.
	import clsx from 'clsx';
	import type { HTMLAttributes } from 'svelte/elements';
	import Slot from '../../../internal/Slot.svelte';
	import type { Content } from '../../../internal/types.js';
	import type { MotionProp } from '../../../ext/motion.svelte.js';
	import CloseButton from '../../Button/CloseButton/CloseButton.svelte';
	import FunctionButton from '../../Button/FunctionButton/FunctionButton.svelte';
	import {
		DEFAULT_ID,
		ICON_SIZE,
		NOTIFICATION_COLORSCHEMES,
		NOTIFICATION_COLORSCHEME_DEFAULT,
		NOTIFICATION_POSITION,
		NOTIFICATION_SIZES,
		NOTIFICATION_SIZE_DEFAULT,
		NOTIFICATION_VARIANTS,
		NOTIFICATION_VARIANT_DEFAULT,
		type NotificationColorScheme,
		type NotificationPosition,
		type NotificationSize,
		type NotificationVariant
	} from '../constants.js';
	import { useNotifications, useNotificationsButtons, useNotificationsHeight, useNotificationsStack } from '../hooks.svelte.js';
	import type { NotificationButtonProps } from '../types.js';
	import { createActionButtons } from '../utils.js';
	import { TOAST_ICON_COMPONENT } from './constants.js';

	interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'children' | 'id'> {
		/** Цветовая схема компонента */
		colorScheme?: NotificationColorScheme;
		/** Задаёт вариант для компонента */
		variant?: NotificationVariant;
		/** Задает размер */
		size?: NotificationSize;
		/** Задает заголовок */
		title?: Content;
		/** Задает подзаголовок */
		subtitle?: Content;
		/** Задает уникальный id для компонента */
		id?: string;
		/** Задает время в миллисекундах, через которое уведомление скроется */
		timeout?: number;
		/** Задает кнопки действий */
		actionButtons?: NotificationButtonProps[];
		/** Callback функция, вызываемая при появлении уведомления */
		onOpen?: () => void;
		/** Callback функция, вызываемая при закрытии уведомления */
		onClose?: () => void;
		/** Задаёт отображение кнопки "Закрыть" */
		closeButton?: boolean;
		/** Задает расположение относительно всего экрана */
		position?: NotificationPosition;
		/** Задаёт отображение иконки */
		showIcon?: boolean;
		/** Задаёт кастомную иконку */
		icon?: Content;
		/** Корневой элемент (forwardRef) */
		ref?: HTMLDivElement | null;
		/**
		 * [ext, not in original] The motion setting of this notification (`addNotification({ ..., motion })`). It is read by the
		 * ToastNotificationsProvider stack; a standalone toast ignores it (and, unlike unknown props, it never reaches the DOM).
		 */
		motion?: MotionProp;
		/** [ext, not in original] Rendered by the extension layer's Svelte-motion stack: natural height, no class transitions, class `rt-ext-toast`. */
		extended?: boolean;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		[key: string]: any;
	}

	let {
		colorScheme = NOTIFICATION_COLORSCHEME_DEFAULT,
		variant = NOTIFICATION_VARIANT_DEFAULT,
		size = NOTIFICATION_SIZE_DEFAULT,
		title,
		subtitle,
		id = DEFAULT_ID,
		timeout,
		actionButtons = [],
		onOpen,
		onClose,
		closeButton,
		position = NOTIFICATION_POSITION.topRight,
		showIcon = true,
		icon,
		class: className = '',
		ref = $bindable(null),
		motion: _motion,
		extended = false,
		...rest
	}: Props = $props();

	const IconComponent = $derived(TOAST_ICON_COMPONENT[colorScheme]);

	const notifications = useNotifications({ onOpen: () => onOpen, onClose: () => onClose });
	// [ext] an extended toast keeps its natural height (`.rt-ext-toast`), so the stack can measure / flip it right away
	useNotificationsHeight(
		() => (extended ? null : ref),
		() => notifications.isOpen
	);
	const { closeNotification } = useNotificationsStack();
	const { buttonsRef } = useNotificationsButtons();

	const handleCloseToastNotification = () => {
		onClose?.();
		closeNotification(id);
	};

	// React re-arms the timer whenever onClose / timeout / id change (deps of the effect, compared by VALUE). The props may reach this
	// component through a spread whose object is re-created on every update of the stack, so read them through `$derived` (which only
	// notifies when the value really changed) - otherwise every newly added toast would restart the timers of the older ones.
	const timeoutMs = $derived(timeout);
	const toastId = $derived(id);
	const closeCallback = $derived(onClose);

	$effect(() => {
		void closeCallback;
		void toastId;
		const ms = timeoutMs;
		if (ms) {
			const timer = setTimeout(handleCloseToastNotification, ms);
			return () => clearTimeout(timer);
		}
	});

	const buttons = $derived(
		createActionButtons(actionButtons).map(({ button, id: key }) => {
			const { action, ...buttonProps } = button;
			return { key, action, buttonProps };
		})
	);

	const isHorizontal = $derived(!subtitle);
	const rootClass = $derived(
		clsx(
			'atmr-toast-notification',
			`atmr-toast-notification--size-${NOTIFICATION_SIZES[size]}`,
			`atmr-toast-notification--${NOTIFICATION_VARIANTS[variant]}`,
			`atmr-toast-notification--${NOTIFICATION_COLORSCHEMES[colorScheme]}`,
			`atmr-toast-notification--${NOTIFICATION_POSITION[position]}`,
			{ 'atmr-toast-notification--horizontal': isHorizontal },
			`${className}`,
			extended && 'rt-ext-toast'
		)
	);
</script>

<div class={rootClass} bind:this={ref} {...rest}>
	<div class="atmr-toast-notification__wrapper">
		{#if showIcon && (IconComponent || icon)}
			<div class="atmr-toast-notification__icon">
				{#if icon}<Slot content={icon} />{:else}<IconComponent size={ICON_SIZE} />{/if}
			</div>
		{/if}
		<div class="atmr-toast-notification__content">
			<div class="atmr-toast-notification__inner">
				{#if title}<h4 class="atmr-toast-notification__title"><Slot content={title} /></h4>{/if}
				{#if subtitle}<p class="atmr-toast-notification__subtitle"><Slot content={subtitle} /></p>{/if}
				{#if buttons.length > 0}
					<div class="atmr-toast-notification__actions" use:buttonsRef>
						{#each buttons as { key, action, buttonProps } (key)}
							<FunctionButton {...buttonProps} onclick={() => action(id)} />
						{/each}
					</div>
				{/if}
			</div>
			{#if closeButton}
				<div class="atmr-toast-notification__close"><CloseButton onclick={handleCloseToastNotification} size="s" /></div>
			{/if}
		</div>
	</div>
</div>
