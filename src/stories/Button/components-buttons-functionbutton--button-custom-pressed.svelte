<script lang="ts">
	import FunctionButton from '$lib/components/Button/FunctionButton/FunctionButton.svelte';
	import Rating from '$lib/icons/24/rating/Rating.svelte';
	import RatingFill from '$lib/icons/24/rating/RatingFill.svelte';

	let isPressed = $state(false);
	const handleClick = async () => {
		isPressed = !isPressed;
	};
</script>

<FunctionButton onclick={handleClick} iconPosition="left" label={isPressed ? 'В избранном' : 'Добавить в избранное'}>
	{#snippet icon()}{#if isPressed}<RatingFill />{:else}<Rating />{/if}{/snippet}
</FunctionButton>
