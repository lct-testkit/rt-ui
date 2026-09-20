<script lang="ts">
	// Port of stories/Multiselect AsyncOptions, decorator `decorateStory`
	import DecorateStory from '../_utils/DecorateStory.svelte';
	import Button from '$lib/components/Button/Button/Button.svelte';
	import Multiselect from '$lib/components/Multiselect/Multiselect.svelte';
	import type { DropdownMenuItem } from '$lib/components/DropdownMenu/types.js';
	import { OPTIONS_SELECTIONS } from '../Select/_options.js';

	let options = $state.raw<DropdownMenuItem[]>([]);

	function handleClick() {
		options = OPTIONS_SELECTIONS;
	}
</script>

<DecorateStory>
	<Multiselect size="m" useInPortal autocomplete={{ enabled: true }} items={options} />
	<Button onclick={handleClick} label="Load options" style="margin-top: var(--atmr-spacing-4x)" />
</DecorateStory>
