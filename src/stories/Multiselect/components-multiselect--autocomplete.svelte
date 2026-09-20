<script lang="ts">
	// Port of stories/Multiselect Autocomplete, decorator `decorateStory`
	import DecorateStory from '../_utils/DecorateStory.svelte';
	import Multiselect from '$lib/components/Multiselect/Multiselect.svelte';
	import { OPTIONS } from '../Select/_options.js';
</script>

<DecorateStory>
	<Multiselect size="l" useInPortal autocomplete={{ enabled: true }} items={OPTIONS} />
</DecorateStory>
