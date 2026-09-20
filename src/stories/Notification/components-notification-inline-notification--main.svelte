<script lang="ts">
	// Port of stories/Notification: InlineNotification "Main" (title "Components/Notification/Inline Notification"), args
	// { subtitle: 'Subtitle', title: 'Title', variant: 'primary', size: 'm', colorScheme: 'info', actionButtons: [2 buttons], closeButton: true }
	import './_notification-styles.css';
	import InlineNotification from '$lib/components/Notifications/InlineNotification/InlineNotification.svelte';

	const actionButtons = [
		{ label: 'Button 1', action: (id: string) => console.log(`click Button from notification id: ${id}`) },
		{ label: 'Button 2', action: (id: string) => console.log(`click Button from notification id: ${id}`) }
	];
</script>

<div class="inline-notification-example">
	<InlineNotification subtitle="Subtitle" title="Title" variant="primary" size="m" colorScheme="info" {actionButtons} closeButton />
</div>
