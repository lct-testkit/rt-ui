<script lang="ts">
	import FunctionButton from '$lib/components/Button/FunctionButton/FunctionButton.svelte';
	import AddLarge from '$lib/icons/24/action/AddLarge.svelte';
	import AddLarge16 from '$lib/icons/16/action/AddLarge16.svelte';
	import Heart from '$lib/icons/24/rating/Heart.svelte';
	import Heart16 from '$lib/icons/16/rating/Heart16.svelte';
	import Print from '$lib/icons/24/action/Print.svelte';
	import Print16 from '$lib/icons/16/action/Print16.svelte';
	import Refresh from '$lib/icons/24/action/Refresh.svelte';
	import Refresh16 from '$lib/icons/16/action/Refresh16.svelte';
	import SettingsAdjust from '$lib/icons/24/action/SettingsAdjust.svelte';
	import SettingsAdjust16 from '$lib/icons/16/action/SettingsAdjust16.svelte';

	// initialArgs (meta args + story args)
	const args = { icon: 'Heart', label: 'Function Button', variant: 'primary', size: 's', iconPosition: 'right' } as const;
	const iconMap: Record<string, typeof Heart | undefined> = {
		AddLarge,
		AddLarge16,
		Heart,
		Heart16,
		Print,
		Print16,
		Refresh,
		Refresh16,
		SettingsAdjust,
		SettingsAdjust16
	};
	const Icon = iconMap[args.icon];
</script>

<FunctionButton variant={args.variant} size={args.size} iconPosition={args.iconPosition} label={args.label}>
	{#snippet icon()}{#if Icon}<Icon />{/if}{/snippet}
</FunctionButton>
