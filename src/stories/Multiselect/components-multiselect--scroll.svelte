<script lang="ts">
	// Port of stories/Multiselect Scroll, decorator `decorateStory`
	import DecorateStory from '../_utils/DecorateStory.svelte';
	import Multiselect from '$lib/components/Multiselect/Multiselect.svelte';
	import { OPTIONS_CITIES } from '../Select/_options.js';
	import './styles.css';
</script>

<DecorateStory>
	<Multiselect size="m" useInPortal autocomplete={{ enabled: true }} items={OPTIONS_CITIES} dropdownMenuClassName="stories-ms-scroll" />
</DecorateStory>
