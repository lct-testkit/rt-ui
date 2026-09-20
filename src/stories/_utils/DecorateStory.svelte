<script lang="ts">
	// Port of `decorateStory` (stories-app/src/utils/storybook.tsx): fixed 280px wide wrapper used as a story decorator.
	//   <DecorateStory><Tree ... /></DecorateStory>
	// DOM: <div style="width: 280px">...children...</div>
	import type { Snippet } from 'svelte';

	let { children }: { children?: Snippet } = $props();
</script>

<div style="width: 280px">{@render children?.()}</div>
