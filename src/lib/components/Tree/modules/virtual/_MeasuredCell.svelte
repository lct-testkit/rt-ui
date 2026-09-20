<script lang="ts">
	// Port of react-virtualized 9.22.6 `CellMeasurer` as the Tree uses it (`registerChild` on the row `<div>`): after the row is rendered
	// its height is measured (with `height: auto`, width as rendered) and stored in the cache; the list then re-computes its layout.
	//   <div style="height: 40px; left: 0px; position: absolute; top: 80px; width: 100%">row content</div>
	import { untrack, type Snippet } from 'svelte';
	import type { CellMeasurerCache } from './CellMeasurerCache.js';
	import type { VirtualListApi } from './types.js';

	let { cache, rowIndex, parent, style, children }: { cache: CellMeasurerCache; rowIndex: number; parent: VirtualListApi; style: string; children?: Snippet } = $props();

	let node = $state<HTMLDivElement | null>(null);

	const getCellMeasurements = (): { height: number; width: number } => {
		const cell = node;
		if (cell && cell.ownerDocument && cell.ownerDocument.defaultView && cell instanceof cell.ownerDocument.defaultView.HTMLElement) {
			const styleWidth = cell.style.width;
			const styleHeight = cell.style.height;
			if (!cache.hasFixedWidth()) {
				cell.style.width = 'auto';
			}
			if (!cache.hasFixedHeight()) {
				cell.style.height = 'auto';
			}
			const height = Math.ceil(cell.offsetHeight);
			const width = Math.ceil(cell.offsetWidth);
			if (styleWidth) {
				cell.style.width = styleWidth;
			}
			if (styleHeight) {
				cell.style.height = styleHeight;
			}
			return { height, width };
		}
		return { height: 0, width: 0 };
	};

	const maybeMeasureCell = () => {
		if (!cache.has(rowIndex, 0)) {
			const { height, width } = getCellMeasurements();
			cache.set(rowIndex, 0, width, height);
			parent.invalidateCellSizeAfterRender({ columnIndex: 0, rowIndex });
		}
	};

	// ref callback + componentDidMount + componentDidUpdate
	$effect(() => {
		void node;
		void style;
		void rowIndex;
		untrack(maybeMeasureCell);
	});
</script>

<div bind:this={node} {style}>{@render children?.()}</div>
