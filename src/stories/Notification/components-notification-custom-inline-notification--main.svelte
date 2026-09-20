<script lang="ts">
	// Port of stories/Notification: CustomInlineNotification "Main", args { variant: 'primary', size: 'm' }
	import './_notification-styles.css';
	import CustomInlineNotification from '$lib/components/Notifications/CustomInlineNotification/CustomInlineNotification.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
</script>

<div class="inline-notification-example">
	<CustomInlineNotification variant="primary" size="m">
		<div class="notification">
			<Typography variant="body-m">Здесь может быть любой контент</Typography>
		</div>
	</CustomInlineNotification>
</div>
