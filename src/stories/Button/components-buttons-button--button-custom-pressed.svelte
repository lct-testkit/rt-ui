<script lang="ts">
	import Button from '$lib/components/Button/Button/Button.svelte';
	let isPressed = $state(false);
</script>

<Button onclick={() => (isPressed = !isPressed)} variant={isPressed ? 'primary' : 'outline'} label="Click me" />
