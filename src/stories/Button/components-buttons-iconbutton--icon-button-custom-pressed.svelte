<script lang="ts">
	import IconButton from '$lib/components/Button/IconButton/IconButton.svelte';
	import Heart from '$lib/icons/24/rating/Heart.svelte';
	import HeartFill from '$lib/icons/24/rating/HeartFill.svelte';

	let isPressed = $state(false);
	const handleClick = async () => {
		isPressed = !isPressed;
	};
</script>

<IconButton onclick={handleClick} variant={isPressed ? 'primary' : 'outline'}>
	{#snippet icon()}{#if isPressed}<HeartFill />{:else}<Heart />{/if}{/snippet}
</IconButton>
