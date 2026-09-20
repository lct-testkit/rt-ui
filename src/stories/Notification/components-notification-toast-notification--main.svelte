<script lang="ts">
	// Port of stories/Notification: ToastNotification "Main" (name "Toast Notifications"). The story renders its OWN provider around the
	// button (ToastNotificationsExampleStory), args { position: 'topRight', maxCount: 3, transitionGroupProps: {}, cssTransitionProps: {} }
	import './_notification-styles.css';
	import ToastNotificationsProvider from '$lib/components/wrappers/ToastNotificationsProvider/ToastNotificationsProvider.svelte';
	import NotificationButton from './_NotificationButton.svelte';
</script>

<ToastNotificationsProvider position="topRight" maxCount={3} transitionGroupProps={{}} cssTransitionProps={{}}>
	<NotificationButton />
</ToastNotificationsProvider>
