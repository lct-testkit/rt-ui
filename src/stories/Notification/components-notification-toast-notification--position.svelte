<script lang="ts">
	// Port of stories/Notification: ToastNotification "Position": one provider (own toast container) per position, wrapped in `.row`
	import './_notification-styles.css';
	import { NOTIFICATION_POSITION } from '$lib/components/Notifications/constants.js';
	import ToastNotificationsProvider from '$lib/components/wrappers/ToastNotificationsProvider/ToastNotificationsProvider.svelte';
	import NotificationButton from './_NotificationButton.svelte';
</script>

<div class="row" style="flex-wrap: wrap">
	{#each Object.values(NOTIFICATION_POSITION) as v (v)}
		<ToastNotificationsProvider position={v}>
			<NotificationButton label={v} />
		</ToastNotificationsProvider>
	{/each}
</div>
