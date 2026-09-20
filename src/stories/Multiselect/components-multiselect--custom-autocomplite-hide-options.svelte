<script lang="ts">
	// Port of stories/Multiselect CustomAutocompliteHideOptions, decorator `decorateStory`
	import DecorateStory from '../_utils/DecorateStory.svelte';
	import Multiselect from '$lib/components/Multiselect/Multiselect.svelte';
	import type { DropdownMenuItem } from '$lib/components/DropdownMenu/types.js';
	import { OPTIONS_SELECTIONS } from '../Select/_options.js';

	let options = $state.raw<DropdownMenuItem[]>(OPTIONS_SELECTIONS);

	function searchHandler(query: string) {
		if (query) {
			options = OPTIONS_SELECTIONS.filter((option) => String(option.value).toLowerCase().indexOf(query.toLowerCase()) > -1);
			return;
		}
		options = [];
	}
</script>

<DecorateStory>
	<Multiselect
		size="m"
		useInPortal
		items={options}
		autocomplete={{ enabled: true, onChange: searchHandler }}
		onFocus={() => (options = [])}
		hideSelectedItems
		emptyText={null}
	/>
</DecorateStory>
