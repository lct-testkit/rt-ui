<script lang="ts">
	import IconButton from '$lib/components/Button/IconButton/IconButton.svelte';
	import AddLarge from '$lib/icons/24/action/AddLarge.svelte';
	import LinkNative from '$lib/icons/24/navigation/LinkNative.svelte';
	import MenuKebab from '$lib/icons/24/navigation/MenuKebab.svelte';

	// initialArgs
	const args = { icon: 'MenuKebab', variant: 'primary', size: 'm', colorScheme: 'accent' } as const;
	const iconMap: Record<string, typeof AddLarge | undefined> = { AddLarge, LinkNative, MenuKebab };
	const Icon = iconMap[args.icon];
</script>

<IconButton variant={args.variant} size={args.size} colorScheme={args.colorScheme}>
	{#snippet icon()}{#if Icon}<Icon />{/if}{/snippet}
</IconButton>
