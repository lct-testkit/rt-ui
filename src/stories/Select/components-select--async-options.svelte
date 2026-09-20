<script lang="ts">
	// Port of stories/Select AsyncOptions (the options arrive 5 s after the button click), decorator `decorateStory`
	import DecorateStory from '../_utils/DecorateStory.svelte';
	import Button from '$lib/components/Button/Button/Button.svelte';
	import Select from '$lib/components/Select/Select.svelte';
	import type { DropdownMenuItem } from '$lib/components/DropdownMenu/types.js';
	import { OPTIONS_SELECTIONS } from './_options.js';

	let options = $state.raw<DropdownMenuItem[]>([]);

	function handleClick() {
		setTimeout(() => {
			options = OPTIONS_SELECTIONS;
		}, 5000);
	}
</script>

<DecorateStory>
	<Select items={options} />
	<Button onclick={handleClick} label="Load options" style="margin-top: var(--atmr-spacing-4x)" />
</DecorateStory>
