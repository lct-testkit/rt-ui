<script lang="ts">
	// Port of stories/Notification: InlineNotification "ColorScheme" (decorators: examplesDecorator)
	import './_notification-styles.css';
	import InlineNotification from '$lib/components/Notifications/InlineNotification/InlineNotification.svelte';
	import { NOTIFICATION_COLORSCHEMES } from '$lib/components/Notifications/constants.js';
	import ExamplesDecorator from '../_utils/ExamplesDecorator.svelte';
</script>

<ExamplesDecorator>
	{#each Object.values(NOTIFICATION_COLORSCHEMES) as v (v)}
		<InlineNotification colorScheme={v} title={v} class="stories-inline-notification-colorscheme" />
	{/each}
</ExamplesDecorator>
