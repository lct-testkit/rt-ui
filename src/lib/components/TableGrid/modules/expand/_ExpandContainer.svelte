<script lang="ts">
	// Port of shared/modules/expand/components/ExpandContainer.tsx: the content of an expanded row (`rowConfig.expand.render(row)`),
	// placed on the grid line after the row and offset by the addon column.
	import { tableSlide, useTableMotion } from '../../../../ext/tableMotion.svelte.js';
	import { normalizeRowKey } from '../../utils.js';
	import { useLayoutActions } from '../layout/layout.svelte.js';
	import { useRow } from '../row/row.svelte.js';
	import { useExpand } from './expand.svelte.js';

	const rowContext = useRow();
	const expand = useExpand();
	const { resetHighliting } = useLayoutActions();
	// [ext, not in original] `transition:tableSlide` slides the content open / shut (zero-length unless `motion` is on for the table)
	const motion = useTableMotion();
	const OFF = { enabled: false };

	const row = $derived(rowContext());
	const isExpanded = $derived(row.id !== undefined && expand.isRowExpanded(normalizeRowKey(row.id)));
	const render = $derived(expand.expandRender);
	const onReset = () => resetHighliting();
</script>

{#if row.isExpandable && isExpanded}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="atmr-tablegrid__expand__root" style="--row-index: {row.position === undefined ? 'auto' : row.position + 1}" onmouseenter={onReset} onmouseleave={onReset}>
		<div class="atmr-tablegrid__expand__container" style={expand.offsetEnable ? '--offset: var(--addon-column-width)' : undefined} data-table-expand-container="true" transition:tableSlide={motion ? motion.slide('expand') : OFF}>
			{#if render && row.data}{@render render(row.data)}{/if}
		</div>
	</div>
{/if}
