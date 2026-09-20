<script lang="ts">
	// Port of stories/Notification: ToastNotification "ColorScheme": one provider with a button per color scheme, wrapped in `.row`
	import './_notification-styles.css';
	import { NOTIFICATION_COLORSCHEMES } from '$lib/components/Notifications/constants.js';
	import ToastNotificationsProvider from '$lib/components/wrappers/ToastNotificationsProvider/ToastNotificationsProvider.svelte';
	import NotificationButton from './_NotificationButton.svelte';
</script>

<div class="row">
	<ToastNotificationsProvider position="topRight">
		{#each Object.values(NOTIFICATION_COLORSCHEMES) as v (v)}
			<NotificationButton label={v} colorScheme={v} />
		{/each}
	</ToastNotificationsProvider>
</div>
