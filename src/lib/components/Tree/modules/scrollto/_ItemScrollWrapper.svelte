<script lang="ts">
	// Port of packages/tree/src/components/Tree/modules/scrollto/components/ItemScrollWrapper.tsx
	//
	// Wraps one tree row (`<div>`; a virtual tree renders no wrapper). When this row is the `scrollToKey` row (on mount and whenever
	// `scrollToKey` changes) its `offsetTop` is reported to the scroll context.
	import type { Snippet } from 'svelte';
	import { untrack } from 'svelte';
	import { useTreeScrollTo } from './scrollto.svelte.js';

	let { children, id }: { children?: Snippet; id: string } = $props();

	const scrollTo = useTreeScrollTo();
	let itemRef = $state<HTMLDivElement | null>(null);

	const scroll = () => {
		if (itemRef?.offsetTop) {
			if (id === scrollTo.scrollToKey) {
				scrollTo.scrollToHandler(itemRef.offsetTop);
			}
		}
	};

	// useEffect(() => { scroll(); }, [scrollToKey])
	$effect(() => {
		void scrollTo.scrollToKey;
		untrack(scroll);
	});
</script>

{#if !scrollTo.virtual}
	<div bind:this={itemRef}>{@render children?.()}</div>
{:else}
	{@render children?.()}
{/if}
