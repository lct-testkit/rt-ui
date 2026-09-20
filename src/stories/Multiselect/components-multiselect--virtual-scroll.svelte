<script lang="ts">
	// Port of stories/Multiselect VirtualScroll (2000 generated options), decorator `decorateStory`
	import DecorateStory from '../_utils/DecorateStory.svelte';
	import Multiselect from '$lib/components/Multiselect/Multiselect.svelte';
	import type { DropdownMenuItem } from '$lib/components/DropdownMenu/types.js';
	import './styles.css';

	const generateOptions = (count: number): DropdownMenuItem[] =>
		Array.from(Array(count)).map((_, index) => ({ key: `key ${index + 1}`, value: `value ${index + 1}` }));
	const OPTIONS_VIRTUAL_SCROLL = generateOptions(2000);
</script>

<DecorateStory>
	<Multiselect
		size="m"
		useInPortal
		autocomplete={{ enabled: true }}
		virtualScroll
		items={OPTIONS_VIRTUAL_SCROLL}
		dropdownMenuClassName="stories-ms-scroll"
	/>
</DecorateStory>
