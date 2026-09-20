<script lang="ts">
	// Port of stories/Multiselect autoHeight, decorator `decorateStory`
	import DecorateStory from '../_utils/DecorateStory.svelte';
	import Multiselect from '$lib/components/Multiselect/Multiselect.svelte';
	import { OPTIONS } from '../Select/_options.js';
</script>

<DecorateStory>
	<Multiselect size="m" useInPortal autocomplete={{ enabled: true }} autoHeight items={OPTIONS} />
</DecorateStory>
