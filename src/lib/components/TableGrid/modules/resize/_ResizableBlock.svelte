<script lang="ts">
	// Port of TableGrid/modules/resize/components/ResizableBlock.tsx: the drag handle on the right edge of a header cell.
	import { useResizeController } from './resize.svelte.js';

	const resize = useResizeController();
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="atmr-tablegrid__resizable__block" onmousedown={resize.onResizeStart} onmouseup={resize.onResizeDestroy}></div>
