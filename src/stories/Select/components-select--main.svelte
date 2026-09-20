<script lang="ts">
	// Port of stories/Select Main (`autocomplete: { enabled: !!args.autocomplete }`, `data-testid="click"`), decorator `decorateStory`
	import DecorateStory from '../_utils/DecorateStory.svelte';
	import Select from '$lib/components/Select/Select.svelte';
	import { OPTIONS } from './_options.js';
</script>

<DecorateStory>
	<Select placement="bottom" label="Label" useInPortal items={OPTIONS} variant="primary" size="l" autocomplete={{ enabled: false }} data-testid="click" />
</DecorateStory>
