<script lang="ts">
	// Port of packages/tree/src/components/Tree/TreeItem/LenelIndent/LevelIndent.tsx
	//
	// The guide lines in front of a node: `level + 1` indent cells (`--level: <index>`); the last cell of a node that cannot be
	// expanded gets `atmr-tree__indent--last`. The first / last node of its group is marked `--start` / `--end`.
	import clsx from 'clsx';
	import { useRow } from '../../TableGrid/modules/row/row.svelte.js';

	let { level, isExpandable }: { level: number; isExpandable: boolean } = $props();

	const rowContext = useRow();
	const row = $derived(rowContext());
	const unExpandable = $derived(!isExpandable);
	const indents = $derived(Array.from({ length: level + 1 }, (_, idx) => idx));
</script>

<div class={clsx('atmr-tree__indent-wrapper', { 'atmr-tree__indent-wrapper--start': row.isStart, 'atmr-tree__indent-wrapper--end': row.isEnd })}>
	{#each indents as idx (idx)}
		<div class={clsx('atmr-tree__indent', { 'atmr-tree__indent--last': unExpandable && idx === level })} style="--level: {idx}"></div>
	{/each}
</div>
