<script lang="ts">
	// Port of stories/Select DisabledWithValue, decorator `decorateStory`
	import DecorateStory from '../_utils/DecorateStory.svelte';
	import Select from '$lib/components/Select/Select.svelte';
	import { OPTIONS } from './_options.js';
</script>

<DecorateStory>
	<Select placement="bottom" label="Label" useInPortal value="ember" disabled items={OPTIONS} />
</DecorateStory>
