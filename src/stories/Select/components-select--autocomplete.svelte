<script lang="ts">
	// Port of stories/Select Autocomplete, decorator `decorateStory`
	import DecorateStory from '../_utils/DecorateStory.svelte';
	import Select from '$lib/components/Select/Select.svelte';
	import { OPTIONS } from './_options.js';
</script>

<DecorateStory>
	<Select placement="bottom" label="Label" useInPortal autocomplete={{ enabled: true }} size="l" items={OPTIONS} />
</DecorateStory>
