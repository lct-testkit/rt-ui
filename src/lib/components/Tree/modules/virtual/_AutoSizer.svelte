<script lang="ts">
	// Port of react-virtualized 9.22.6 `AutoSizer` (vertical + horizontal): measures its PARENT element (`offsetHeight` / `offsetWidth` minus
	// the paddings) and hands the size to its content. The parent gets `position: relative` and the `resize-triggers` element of
	// `detectElementResize` (see ./detectElementResize.ts), exactly like in the reference DOM.
	//
	//   <div style="height: 400px"> <AutoSizer>{#snippet children({ height, width })}...{/snippet}</AutoSizer> </div>
	//   DOM: <div style="overflow: visible; height: 0px; width: 0px">content</div>
	import { onMount, type Snippet } from 'svelte';
	import { createDetectElementResize } from './detectElementResize.js';

	let { children }: { children?: Snippet<[{ height: number; width: number }]> } = $props();

	let element = $state<HTMLDivElement | null>(null);
	let height = $state(0);
	let width = $state(0);

	onMount(() => {
		const parent = element?.parentNode;
		const win = parent?.ownerDocument?.defaultView;
		if (!parent || !win || !(parent instanceof win.HTMLElement)) return undefined;

		const onResize = () => {
			const parentHeight = parent.offsetHeight || 0;
			const parentWidth = parent.offsetWidth || 0;
			const style = win.getComputedStyle(parent);
			const paddingLeft = parseInt(style.paddingLeft, 10) || 0;
			const paddingRight = parseInt(style.paddingRight, 10) || 0;
			const paddingTop = parseInt(style.paddingTop, 10) || 0;
			const paddingBottom = parseInt(style.paddingBottom, 10) || 0;
			const newHeight = parentHeight - paddingTop - paddingBottom;
			const newWidth = parentWidth - paddingLeft - paddingRight;
			if (height !== newHeight || width !== newWidth) {
				height = newHeight;
				width = newWidth;
			}
		};

		const detectElementResize = createDetectElementResize(win);
		detectElementResize.addResizeListener(parent, onResize);
		onResize();
		return () => detectElementResize.removeResizeListener(parent, onResize);
	});
</script>

<div bind:this={element} style="overflow: visible; height: 0px; width: 0px;">{@render children?.({ height, width })}</div>
