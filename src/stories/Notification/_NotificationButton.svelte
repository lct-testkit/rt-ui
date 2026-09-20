<script lang="ts">
	// Port of `NotificationButton` (stories/Notification/ToastNotifications.stories.tsx): a Button that adds a toast to the nearest
	// ToastNotificationsProvider. `addNotification({ ...args, icon: ICONS[args.icon] })` - `args` are the story args (see meta.json initialArgs);
	// the ones the ToastNotification does not know (maxCount, transitionGroupProps, cssTransitionProps, label) end up as attributes of its root.
	import Button from '$lib/components/Button/Button/Button.svelte';
	import type { NotificationColorScheme } from '$lib/components/Notifications/constants.js';
	import { useNotificationsStack } from '$lib/components/Notifications/hooks.svelte.js';
	import Heart from '$lib/icons/24/rating/Heart.svelte';

	// `label` / `colorScheme` are what the Position / ColorScheme stories override on the shared args
	let { label, colorScheme = 'info' }: { label?: string; colorScheme?: NotificationColorScheme } = $props();

	const { addNotification } = useNotificationsStack();

	const handleAddNotification = () => {
		addNotification({
			title: 'Title',
			subtitle: 'Subtitle',
			variant: 'primary',
			size: 'm',
			colorScheme,
			closeButton: true,
			actionButtons: [
				{
					label: 'Button 1',
					action: (id: string) => console.log(`click Button from notification id: ${id}`),
					icon: heart,
					iconPosition: 'left',
					variant: 'secondary'
				},
				{
					label: 'Button 2',
					action: (id: string) => console.log(`click Button from notification id: ${id}`),
					icon: heart,
					iconPosition: 'left',
					variant: 'secondary'
				}
			],
			position: 'topRight',
			maxCount: 3,
			timeout: 5000,
			transitionGroupProps: {},
			cssTransitionProps: {},
			...(label === undefined ? {} : { label }),
			icon: undefined
		});
	};
</script>

{#snippet heart()}<Heart />{/snippet}

<Button onclick={handleAddNotification} label={label ?? 'Вызвать уведомление'} />
