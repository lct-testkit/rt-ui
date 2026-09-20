<script lang="ts">
	import Input from '$lib/components/Input/Input.svelte';
	import PasswordShow from '$lib/icons/24/action/PasswordShow.svelte';
	import PasswordHide from '$lib/icons/24/action/PasswordHide.svelte';
	import DecorateStory from '../_utils/DecorateStory.svelte';

	let showPass = $state(false);
	let inputRef = $state<HTMLInputElement | null>(null);

	function handleIconClick(e: MouseEvent) {
		e.preventDefault();
		const input = inputRef;
		if (input) {
			const pos = input.selectionStart;
			input.type = showPass ? 'password' : 'text';
			setTimeout(() => input.setSelectionRange(pos, pos), 0);
			showPass = !showPass;
		}
	}
</script>

{#snippet iconSuffix()}
	{#if showPass}<PasswordShow />{:else}<PasswordHide />{/if}
{/snippet}

<DecorateStory>
	<Input
		size="l"
		placeholder="Password"
		type={showPass ? 'text' : 'password'}
		{iconSuffix}
		onClickIconSuffix={handleIconClick}
		autocomplete="new-password"
		bind:ref={inputRef}
	/>
</DecorateStory>
