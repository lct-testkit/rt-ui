<script lang="ts">
	// Port of shared/modules/row/RowProvider.tsx: renders no DOM, only provides the row state (`useRow()`) to its children.
	import type { Snippet } from 'svelte';
	import { setRowContext, type RowState } from './row.svelte.js';

	let { row, children }: { row: RowState; children?: Snippet } = $props();

	setRowContext(() => row);
</script>

{@render children?.()}
