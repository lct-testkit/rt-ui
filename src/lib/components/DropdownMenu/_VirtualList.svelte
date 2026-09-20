<script lang="ts" generics="T">
	// Svelte counterpart of virtua's React `VList` (as used by DropdownMenu with `virtualScroll`).
	//
	// It is a copy of virtua/svelte's `VList` + `Virtualizer` (same engine: `virtua/unstable_core`, same default overscan 4 and
	// default item size 40) with one difference: the item wrappers carry `margin: 0; padding: 0` like the React (virtua 0.34.2)
	// items do, because the reference DOM contains them and virtua/svelte's own ListItem does not render them.
	//
	// DOM (identical to the React `VList`):
	//   <div style="display:block; overflow-y:auto; contain:strict; width:100%; height:100%; ...style" class>          viewport
	//     <div style="overflow-anchor:none; flex:none; position:relative; visibility:hidden; width:100%; height:{total}px">
	//       <div style="margin:0; padding:0; position:absolute; width:100%; left:0; top:{offset}px; visibility:visible|hidden">
	//         {@render children(item, index)}
	//       </div> ...
	import { onDestroy, onMount, untrack, type Snippet } from 'svelte';
	import {
		ACTION_ITEMS_LENGTH_CHANGE,
		UPDATE_SCROLL_END_EVENT,
		UPDATE_SCROLL_EVENT,
		UPDATE_VIRTUAL_STATE,
		createResizer,
		createScroller,
		createVirtualStore,
		type StateVersion
	} from 'virtua/unstable_core';
	import type { Action } from 'svelte/action';
	import { styleToString, type StyleValue } from '../../utils/style.js';

	interface Props {
		/** Данные списка */
		data: T[];
		/** Отрисовка одного элемента */
		children: Snippet<[item: T, index: number]>;
		/** Количество дополнительно отрисованных элементов с каждой стороны (React `overscan`, по умолчанию 4) */
		overscan?: number;
		/** Размер элемента по умолчанию (по умолчанию 40, размеры измеряются автоматически) */
		itemSize?: number;
		/** Класс viewport-элемента */
		class?: string;
		/** Стили viewport-элемента (после базовых, как в React) */
		style?: StyleValue;
		/** Вызывается при скролле (offset) */
		onscroll?: (offset: number) => void;
		/** Вызывается после окончания скролла */
		onscrollend?: () => void;
		/** Viewport-элемент */
		ref?: HTMLDivElement | null;
	}

	let { data, children, overscan, itemSize, class: className, style, onscroll, onscrollend, ref = $bindable(null) }: Props = $props();

	// the engine is created once (like virtua's own adapters); later changes of `data.length` go through ACTION_ITEMS_LENGTH_CHANGE below
	const store = untrack(() => createVirtualStore(data.length, itemSize, overscan, undefined, undefined, !itemSize));
	const resizer = createResizer(store, false);
	const scroller = createScroller(store, false);

	let stateVersion: StateVersion = $state(store.$getStateVersion());
	const unsubscribeStore = store.$subscribe(UPDATE_VIRTUAL_STATE, () => {
		stateVersion = store.$getStateVersion();
	});
	const unsubscribeOnScroll = store.$subscribe(UPDATE_SCROLL_EVENT, () => {
		onscroll?.(store.$getScrollOffset());
	});
	const unsubscribeOnScrollEnd = store.$subscribe(UPDATE_SCROLL_END_EVENT, () => {
		onscrollend?.();
	});

	let containerRef = $state<HTMLDivElement>();

	const range = $derived(stateVersion && store.$getRange());
	const isScrolling = $derived(stateVersion && store.$isScrolling());
	const totalSize = $derived(stateVersion && store.$getTotalSize());
	const indexes = $derived.by(() => {
		const [start, end] = range;
		const result: number[] = [];
		for (let i = start; i <= end; i++) result.push(i);
		return result;
	});

	onMount(() => {
		const scrollable = containerRef!.parentElement!;
		resizer.$observeRoot(scrollable);
		scroller.$observe(scrollable);
	});
	onDestroy(() => {
		unsubscribeStore();
		unsubscribeOnScroll();
		unsubscribeOnScrollEnd();
		resizer.$dispose();
		scroller.$dispose();
	});

	$effect.pre(() => {
		if (data.length !== store.$getItemsLength()) {
			store.$update(ACTION_ITEMS_LENGTH_CHANGE, [data.length, false]);
		}
	});

	let prevStateVersion: StateVersion | undefined;
	$effect(() => {
		if (prevStateVersion === stateVersion) return;
		prevStateVersion = stateVersion;
		scroller.$fixScrollJump();
	});

	/** virtua registers every item wrapper in the shared ResizeObserver (re-registered when the index of the node changes) */
	const observeItem: Action<HTMLElement, number> = (node, index) => {
		let current = index;
		let cleanup = resizer.$observeItem(node, current);
		return {
			update(next) {
				if (next === current) return;
				cleanup();
				current = next;
				cleanup = resizer.$observeItem(node, current);
			},
			destroy() {
				cleanup();
			}
		};
	};

	export const scrollToIndex = (...args: Parameters<typeof scroller.$scrollToIndex>) => scroller.$scrollToIndex(...args);
	export const scrollTo = (offset: number) => scroller.$scrollTo(offset);

	const viewportStyle = $derived(
		styleToString({ display: 'block', overflowY: 'auto', contain: 'strict', width: '100%', height: '100%' }, style)
	);
	const containerStyle = $derived(
		styleToString({
			overflowAnchor: 'none', // opt out browser's scroll anchoring because it will conflict to scroll anchoring of virtualizer
			flex: 'none',
			position: 'relative',
			visibility: 'hidden',
			width: '100%',
			height: `${totalSize}px`,
			pointerEvents: isScrolling ? 'none' : undefined
		})
	);
</script>

<div bind:this={ref} class={className} style={viewportStyle}>
	<div bind:this={containerRef} style={containerStyle}>
		{#each indexes as index (index)}
			<div
				use:observeItem={index}
				style={styleToString({
					margin: 0,
					padding: 0,
					position: 'absolute',
					width: '100%',
					left: 0,
					top: `${stateVersion && store.$getItemOffset(index)}px`,
					visibility: stateVersion && store.$isUnmeasuredItem(index) ? 'hidden' : 'visible'
				})}
			>
				{@render children(data[index]!, index)}
			</div>
		{/each}
	</div>
</div>
