<script lang="ts">
	// Ports of the three helper components of stories/Notification/CustomToastNotifications.stories.tsx, rendered inside a
	// ToastNotificationsProvider (they read the stack with `useNotificationsStack()`):
	//   kind="default"  Toasts              addCustomNotification({ label, ...args }) with `children(close)` = text + "Закрыть" Button
	//   kind="request"  RequestSentToasts   template "request sent" (check icon, text, CloseButton xs)
	//   kind="message"  MessageToasts       template "new message" (avatar, texts, FunctionButton)
	import Button from '$lib/components/Button/Button/Button.svelte';
	import CloseButton from '$lib/components/Button/CloseButton/CloseButton.svelte';
	import FunctionButton from '$lib/components/Button/FunctionButton/FunctionButton.svelte';
	import { useNotificationsStack } from '$lib/components/Notifications/hooks.svelte.js';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import CheckSmall from '$lib/icons/24/navigation/CheckSmall.svelte';

	let { kind = 'default' }: { kind?: 'default' | 'request' | 'message' } = $props();

	const { addCustomNotification } = useNotificationsStack();

	// story args (meta.json initialArgs; the storybook actions onOpen / onClose have no DOM effect)
	const args = { position: 'topRight', maxCount: 3, timeout: 5000, variant: 'primary', size: 'm' } as const;
	const templateClassName = 'atmr-custom-toast-notification--template'; // `((className || '') + ' ...--template').trim()`

	const handleAddCustomToast = () => {
		if (kind === 'default') addCustomNotification({ label: 'Вызвать уведомление', ...args, children: toastContent });
		else addCustomNotification({ ...args, class: templateClassName, children: kind === 'request' ? requestContent : messageContent });
	};
</script>

{#snippet toastContent(close: () => void)}
	<div class="notification custom-toast-notification">
		<Typography variant="body-m">Здесь может быть любой контент</Typography>
		<Button style="flex-shrink: 0" onclick={close} label="Закрыть" />
	</div>
{/snippet}

{#snippet requestContent(onClose: () => void)}
	<div class="custom-toast-template custom-toast-template--request">
		<span class="custom-toast-template__status-icon"><CheckSmall fill="white" /></span>
		<Typography class="custom-toast-template__title" variant="body-s">Заявка отправлена куда надо</Typography>
		<CloseButton onclick={onClose} size="xs" />
	</div>
{/snippet}

{#snippet messageContent()}
	<div class="custom-toast-template custom-toast-template--message">
		<img class="custom-toast-template__avatar" src="/story-assets/catWithGlasses.svg" alt="Аватар отправителя" />
		<div class="custom-toast-template__body">
			<Typography class="custom-toast-template__title" variant="body-s" strong>Новое сообщение</Typography>
			<Typography class="custom-toast-template__subtitle" variant="description-l">Привет! Ты не видел мой мячик ...</Typography>
		</div>
		<FunctionButton label="Открыть" />
	</div>
{/snippet}

{#if kind === 'default'}
	<div>
		<div class="button-wrapper"><Button onclick={handleAddCustomToast} label="Вызвать уведомление" /></div>
	</div>
{:else}
	<div class="button-wrapper"><Button onclick={handleAddCustomToast} label="Вызвать уведомление" /></div>
{/if}
