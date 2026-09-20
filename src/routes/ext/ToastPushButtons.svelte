<!-- EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. -->
<script lang="ts">
	/** EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. */
	// Two buttons that push a toast into the NEAREST ToastNotificationsProvider (the one of this position): "выкл" adds the notification with
	// `motion: false` (the ORIGINAL markup and class transitions), "Svelte" with `motion: true` (Svelte-native motion: fly in from the side of
	// `position`, fly back out + fade, flip for the rest of the stack).
	import Button from '$lib/components/Button/Button/Button.svelte';
	import { NOTIFICATION_COLORSCHEMES, type NotificationPosition } from '$lib/components/Notifications/constants.js';
	import { useNotificationsStack } from '$lib/components/Notifications/hooks.svelte.js';

	let { pos }: { pos: NotificationPosition } = $props();

	const { addNotification } = useNotificationsStack();
	const schemes = Object.values(NOTIFICATION_COLORSCHEMES);
	let count = 0;

	function push(motion: boolean) {
		const n = ++count;
		addNotification({
			title: `Уведомление ${n}`,
			subtitle: `${pos} · motion: ${motion ? 'svelte' : 'off'}`,
			colorScheme: schemes[n % schemes.length],
			closeButton: true,
			timeout: 6000,
			position: pos,
			motion
		});
	}
</script>

<div class="row">
	<Button size="s" variant="outline" colorScheme="neutral" label="выкл" onclick={() => push(false)} data-testid="toast-{pos}-off" />
	<Button size="s" label="Svelte" onclick={() => push(true)} data-testid="toast-{pos}-svelte" />
</div>

<style>
	.row {
		display: flex;
		gap: var(--atmr-spacing-2x);
	}
</style>
