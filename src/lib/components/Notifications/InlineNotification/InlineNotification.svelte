<script lang="ts">
	// Port of InlineNotification (packages/ui-kit/src/components/Notifications/InlineNotification/InlineNotification.tsx)
	// rendered inside a react-transition-group CSSTransition (`atmr-inline-notifications-*` classes, 300 ms, mountOnEnter/unmountOnExit).
	import clsx from 'clsx';
	import type { HTMLAttributes } from 'svelte/elements';
	import Slot from '../../../internal/Slot.svelte';
	import type { Content } from '../../../internal/types.js';
	import CloseButton from '../../Button/CloseButton/CloseButton.svelte';
	import FunctionButton from '../../Button/FunctionButton/FunctionButton.svelte';
	import { CSSTransition, type CSSTransitionConfig } from '../_transition.svelte.js';
	import {
		DEFAULT_ID,
		ICON_SIZE,
		INLINE_NOTIFICATION_TIMEOUT,
		NOTIFICATION_COLORSCHEMES,
		NOTIFICATION_COLORSCHEME_DEFAULT,
		NOTIFICATION_SIZES,
		NOTIFICATION_SIZE_DEFAULT,
		NOTIFICATION_VARIANTS,
		NOTIFICATION_VARIANT_DEFAULT,
		type NotificationColorScheme,
		type NotificationSize,
		type NotificationVariant
	} from '../constants.js';
	import { useNotifications, useNotificationsButtons } from '../hooks.svelte.js';
	import type { NotificationButtonProps } from '../types.js';
	import { createActionButtons } from '../utils.js';
	import { INLINE_ICON_COMPONENT } from './constants.js';

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
		/** Задает кнопки действий */
		actionButtons?: NotificationButtonProps[];
		/** Callback функция, вызываемая при появлении уведомления */
		onOpen?: () => void;
		/** Callback функция, вызываемая при закрытии уведомления */
		onClose?: () => void;
		/** Задаёт отображение кнопки "Закрыть" */
		closeButton?: boolean;
		/** Задает уникальный id для компонента */
		id?: string;
		/** Задаёт кастомную иконку */
		icon?: Content;
		/** Deprecated: иконка показывается всегда (в React проп попадал в атрибуты корня без эффекта) */
		showIcon?: boolean;
		/** Параметры для CSSTransition (https://reactcommunity.org/react-transition-group) */
		transitionProps?: CSSTransitionConfig;
		/** Корневой элемент */
		ref?: HTMLDivElement | null;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		[key: string]: any;
	}

	let {
		colorScheme = NOTIFICATION_COLORSCHEME_DEFAULT,
		variant = NOTIFICATION_VARIANT_DEFAULT,
		size = NOTIFICATION_SIZE_DEFAULT,
		title,
		subtitle,
		actionButtons = [],
		onOpen,
		onClose,
		closeButton,
		id = DEFAULT_ID,
		icon,
		showIcon: _showIcon,
		class: className = '',
		transitionProps = {},
		ref = $bindable(null),
		...rest
	}: Props = $props();

	const IconComponent = $derived(INLINE_ICON_COMPONENT[colorScheme]);

	const notifications = useNotifications({ onOpen: () => onOpen, onClose: () => onClose });
	const { buttonsRef } = useNotificationsButtons();

	const transition = new CSSTransition(
		() => notifications.isOpen,
		() => ({
			classNames: 'atmr-inline-notifications',
			timeout: INLINE_NOTIFICATION_TIMEOUT,
			mountOnEnter: true,
			unmountOnExit: true,
			...transitionProps
		}),
		() => ref
	);

	const buttons = $derived(
		createActionButtons(actionButtons).map(({ button, id: key }) => {
			const { action, ...buttonProps } = button;
			return { key, action, buttonProps: { variant: 'secondary', ...buttonProps } as Omit<NotificationButtonProps, 'action'> };
		})
	);

	const rootClass = $derived(
		clsx(
			'atmr-inline-notification',
			`atmr-inline-notification--size-${NOTIFICATION_SIZES[size]}`,
			`atmr-inline-notification--${NOTIFICATION_VARIANTS[variant]}`,
			`atmr-inline-notification--${NOTIFICATION_COLORSCHEMES[colorScheme]}`,
			`${className}`
		)
	);
</script>

{#if transition.status !== 'unmounted'}
	<div class={rootClass} bind:this={ref} {...rest}>
		{#if IconComponent || icon}
			<div class="atmr-inline-notification__icon">
				{#if icon}<Slot content={icon} />{:else}<IconComponent size={ICON_SIZE} />{/if}
			</div>
		{/if}
		<div class="atmr-inline-notification__content">
			<div class="atmr-inline-notification__inner">
				{#if title}<h2 class="atmr-inline-notification__title"><Slot content={title} /></h2>{/if}
				{#if subtitle}<p class="atmr-inline-notification__subtitle"><Slot content={subtitle} /></p>{/if}
				{#if buttons.length > 0}
					<div class="atmr-inline-notification__actions" use:buttonsRef>
						{#each buttons as { key, action, buttonProps } (key)}
							<FunctionButton {...buttonProps} onclick={() => action(id)} />
						{/each}
					</div>
				{/if}
			</div>
			{#if closeButton}
				<div class="atmr-inline-notification__close"><CloseButton onclick={notifications.handleCloseNotification} size="s" /></div>
			{/if}
		</div>
	</div>
{/if}
