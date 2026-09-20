<script lang="ts">
	// Port of stories/Multiselect ControlledComponent, decorator `decorateStory`
	import DecorateStory from '../_utils/DecorateStory.svelte';
	import Multiselect from '$lib/components/Multiselect/Multiselect.svelte';
	import type { DropdownMenuItem } from '$lib/components/DropdownMenu/types.js';
	import { OPTIONS_SELECTIONS } from '../Select/_options.js';

	let selected = $state.raw<DropdownMenuItem[]>([]);
</script>

<DecorateStory>
	<Multiselect
		size="m"
		useInPortal
		autocomplete={{ enabled: true }}
		items={OPTIONS_SELECTIONS}
		value={selected}
		onChange={(opt) => (selected = opt)}
	/>
</DecorateStory>
