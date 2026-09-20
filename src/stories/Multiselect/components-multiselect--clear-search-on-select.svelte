<script lang="ts">
	// Port of stories/Multiselect ClearSearchOnSelect, decorator `decorateStory`
	import DecorateStory from '../_utils/DecorateStory.svelte';
	import Multiselect from '$lib/components/Multiselect/Multiselect.svelte';
	import { OPTIONS_CITIES } from '../Select/_options.js';
</script>

<DecorateStory>
	<Multiselect size="m" useInPortal autocomplete={{ enabled: true, clearSearchOnSelect: false }} hideOnSelect={false} items={OPTIONS_CITIES} />
</DecorateStory>
