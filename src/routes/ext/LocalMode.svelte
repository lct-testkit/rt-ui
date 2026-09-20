<!-- EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. -->
<script lang="ts">
	/** EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. */
	// A per-section motion switch of the /ext demo: 'Как на странице' = no nested provider (the page's own mode, off by default), 'Выкл (оригинал)' = a
	// nested <ExtMotionProvider mode="off">, 'Svelte' = a nested <ExtMotionProvider mode="svelte">. Deep link: `/ext?<param>=off|svelte|page`.
	// `id` prefixes the test ids (`<id>-mode-off`, `<id>-mode-svelte`, `<id>-mode-page`).
	import { onMount, type Snippet } from 'svelte';
	import Segment from '$lib/components/SegmentedControl/Segment/Segment.svelte';
	import SegmentedControl from '$lib/components/SegmentedControl/SegmentedControl.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import ExtMotionProvider from '$lib/ext/ExtMotionProvider.svelte';

	type Local = 'page' | 'off' | 'svelte';
	const LOCAL: [Local, string][] = [
		['page', 'Как на странице'],
		['off', 'Выкл (оригинал)'],
		['svelte', 'Svelte']
	];

	let { param, id, children, bar }: { param: string; id: string; children: Snippet; bar?: Snippet } = $props();

	let local = $state<Local>('page');
	const mode = $derived(local === 'svelte' ? 'svelte' : 'off');

	onMount(() => {
		const v = new URLSearchParams(location.search).get(param);
		if (v === 'off' || v === 'svelte' || v === 'page') local = v;
	});
</script>

<div class="bar">
	<Typography variant="body-s" strong as="span">Режим</Typography>
	<SegmentedControl size="s" value={local} onChange={(i: string) => (local = i as Local)}>
		{#each LOCAL as [k, label] (k)}
			<Segment index={k} {label} data-testid="{id}-mode-{k}" />
		{/each}
	</SegmentedControl>
	{@render bar?.()}
</div>

{#if local === 'page'}
	{@render children()}
{:else}
	<ExtMotionProvider {mode}>
		{@render children()}
	</ExtMotionProvider>
{/if}

<style>
	.bar {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: var(--atmr-spacing-3x) var(--atmr-spacing-4x);
		margin-bottom: var(--atmr-spacing-3x);
	}
</style>
