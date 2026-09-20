<script lang="ts">
	// Port of stories/Multiselect Main (`autocomplete: { enabled: !!args.autocomplete }`, `data-testid="click"`), decorator `decorateStory`
	import DecorateStory from '../_utils/DecorateStory.svelte';
	import Multiselect from '$lib/components/Multiselect/Multiselect.svelte';
	import { OPTIONS } from '../Select/_options.js';
</script>

<DecorateStory>
	<Multiselect size="l" variant="primary" label="Label" autoHeight={false} items={OPTIONS} autocomplete={{ enabled: true }} useInPortal data-testid="click" />
</DecorateStory>
