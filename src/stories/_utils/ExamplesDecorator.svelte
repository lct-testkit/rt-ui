<script lang="ts">
	// Port of `examplesDecorator` (stories-app/src/utils/storybook.tsx) — used as `decorators: examplesDecorator` by the
	// "Examples" stories (variant / size / color scheme ... side by side):
	//   <ExamplesDecorator>{#each VARIANT as v}<Button variant={v} label={v} />{/each}</ExamplesDecorator>
	// DOM: <div style="display:flex; justify-content:center; align-items:end; gap:10px; width:100%">...children...</div>
	import type { Snippet } from 'svelte';

	let { children }: { children?: Snippet } = $props();
</script>

<div style="display: flex; justify-content: center; align-items: end; gap: 10px; width: 100%">{@render children?.()}</div>
