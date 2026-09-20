<script lang="ts">
	import Button from '$lib/components/Button/Button/Button.svelte';
	import Overlay from '$lib/components/Overlay/Overlay.svelte';
	import { OVERLAY_VARIANTS } from '$lib/components/Overlay/constants.js';
	import ExamplesDecorator from '../_utils/ExamplesDecorator.svelte';

	// one `useState(false)` per variant
	let opened = $state<Record<string, boolean>>(Object.fromEntries(OVERLAY_VARIANTS.map((v) => [v, false])));
</script>

<ExamplesDecorator>
	{#each OVERLAY_VARIANTS as v}
		<div>
			<Button label={`Open ${v} overlay`} variant="ghost" onclick={() => (opened[v] = !opened[v])} />
			<Overlay isOpened={opened[v]} variant={v} useInPortal onclick={() => (opened[v] = false)} />
		</div>
	{/each}
</ExamplesDecorator>
