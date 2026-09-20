<script lang="ts">
	// Port of stories/Notification: CustomToastNotification "CustomToastNotifications": the story renders its OWN provider
	// (ToastNotificationsExample) around `Toasts`, args { position: 'topRight', maxCount: 3 }
	import './_notification-styles.css';
	import ToastNotificationsProvider from '$lib/components/wrappers/ToastNotificationsProvider/ToastNotificationsProvider.svelte';
	import CustomToastButton from './_CustomToastButton.svelte';
</script>

<ToastNotificationsProvider position="topRight" maxCount={3}>
	<CustomToastButton kind="default" />
</ToastNotificationsProvider>
