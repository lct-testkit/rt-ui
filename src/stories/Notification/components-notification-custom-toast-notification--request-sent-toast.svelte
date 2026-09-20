<script lang="ts">
	// Port of stories/Notification: CustomToastNotification "RequestSentToast" (CustomToastTemplateStory + RequestSentToasts)
	import './_notification-styles.css';
	import ToastNotificationsProvider from '$lib/components/wrappers/ToastNotificationsProvider/ToastNotificationsProvider.svelte';
	import CustomToastButton from './_CustomToastButton.svelte';
</script>

<ToastNotificationsProvider position="topRight" maxCount={3}>
	<CustomToastButton kind="request" />
</ToastNotificationsProvider>
