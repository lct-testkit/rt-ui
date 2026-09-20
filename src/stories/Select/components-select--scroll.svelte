<script lang="ts">
	// Port of stories/Select Scroll, decorator `decorateStory`
	import DecorateStory from '../_utils/DecorateStory.svelte';
	import Select from '$lib/components/Select/Select.svelte';
	import { OPTIONS_CITIES } from './_options.js';
</script>

<DecorateStory>
	<Select placement="bottom" label="Label" useInPortal items={OPTIONS_CITIES} dropdownMenuListClassName="stories-ms-scroll" />
</DecorateStory>

<style>
	/* stories/Multiselect/styles.css (the class only takes effect on a virtual-scroll list: React's plain list ignores dropdownMenuListClassName) */
	:global(.stories-ms-scroll) {
		:global(.atmr-dropdown-menu__menu) {
			max-height: 300px;
			overflow: auto;
		}
	}
</style>
