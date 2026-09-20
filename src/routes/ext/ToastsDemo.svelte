<!-- EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. -->
<script lang="ts">
	/** EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. */
	// Live example of the toast motion extension: one ToastNotificationsProvider per screen position (like the original "Position" story), each with a
	// "выкл" (motion: false = the original markup) and a "Svelte" (motion: true = fly in from the side + fade, fly back out + fade, flip) button.
	// The providers sit INSIDE the page's <ExtMotionProvider>; the buttons set `motion` per notification, so they work in every global mode.
	import { NOTIFICATION_POSITION } from '$lib/components/Notifications/constants.js';
	import ToastNotificationsProvider from '$lib/components/wrappers/ToastNotificationsProvider/ToastNotificationsProvider.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import ToastPushButtons from './ToastPushButtons.svelte';

	const POSITIONS = Object.values(NOTIFICATION_POSITION);
</script>

<div class="grid">
	{#each POSITIONS as pos (pos)}
		<div class="cell" data-testid="toast-cell-{pos}">
			<Typography variant="body-s" strong as="span">{pos}</Typography>
			<ToastNotificationsProvider position={pos}>
				<ToastPushButtons {pos} />
			</ToastNotificationsProvider>
		</div>
	{/each}
</div>

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
		gap: var(--atmr-spacing-3x);
	}
	.cell {
		display: flex;
		flex-direction: column;
		gap: var(--atmr-spacing-2x);
		padding: var(--atmr-spacing-3x) var(--atmr-spacing-4x);
		border-radius: var(--atmr-border-radius-l);
		border: var(--atmr-border-width-s) solid var(--atmr-border-soft);
		background: var(--atmr-neutral-container-soft);
	}
</style>
