<script lang="ts">
	// Port of packages/tree/src/components/Tree/modules/scrollto/components/ListScrollWrapper.tsx
	//
	// The scrolling container of the (non-virtual) tree: `<div style="height: inherit; [overflow: auto while scrollToKey is set]">`. The root
	// tree scrolls itself to `scrollToY` (reported by the row wrapper of the `scrollToKey` node). A virtual tree has no wrapper.
	import type { Snippet } from 'svelte';
	import { useTreeStyled } from '../styled/styled.svelte.js';
	import { useTreeScrollTo } from './scrollto.svelte.js';

	let { children, isRoot }: { children?: Snippet; isRoot: boolean } = $props();

	const scrollTo = useTreeScrollTo();
	const styled = useTreeStyled();
	let listref = $state<HTMLDivElement | null>(null);

	// useEffect(..., [listref, scrollToY, size, scrollToKey, isRoot])
	$effect(() => {
		const list = listref;
		const y = scrollTo.scrollToY;
		void styled.size;
		void scrollTo.scrollToKey;
		if (list && isRoot) {
			list.scrollTo(0, y - list.getBoundingClientRect().top);
		}
	});
</script>

{#if !scrollTo.virtual && isRoot}
	<div bind:this={listref} style:height="inherit" style:overflow={scrollTo.scrollToKey ? 'auto' : undefined}>{@render children?.()}</div>
{:else if !scrollTo.virtual && !isRoot}
	<div style:height="inherit">{@render children?.()}</div>
{:else}
	{@render children?.()}
{/if}
