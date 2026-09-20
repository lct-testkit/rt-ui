<script lang="ts">
	// Port of packages/tree/src/components/Tree/TreeItem/ButtonsList/ExpandButton/ExpandButton.tsx
	//
	// The toggle of an expandable node. React names kept: the `collapsedIcon` prop is shown while the node is EXPANDED and the `expandedIcon`
	// prop while it is COLLAPSED (defaults: chevron down / chevron right, 24px for size `m`, 16px for `s`).
	import ChevronDown16 from '../../../icons/16/navigation/ChevronDown16.svelte';
	import ChevronRight16 from '../../../icons/16/navigation/ChevronRight16.svelte';
	import ChevronDown from '../../../icons/24/navigation/ChevronDown.svelte';
	import ChevronRight from '../../../icons/24/navigation/ChevronRight.svelte';
	import Slot from '../../../internal/Slot.svelte';
	import { noop } from '../../../utils/noop.js';
	import { useExpand } from '../../TableGrid/modules/expand/expand.svelte.js';
	import { useRow } from '../../TableGrid/modules/row/row.svelte.js';
	import { normalizeRowKey } from '../../TableGrid/utils.js';
	import { useTreeCallbacks } from '../modules/callbacks/callbacks.svelte.js';
	import { useTreeStyled } from '../modules/styled/styled.svelte.js';

	let { id, disabled }: { id: string; disabled?: boolean } = $props();

	const styled = useTreeStyled();
	const expand = useExpand();
	const callbacks = useTreeCallbacks();
	const rowContext = useRow();

	const isExpandable = $derived(!!rowContext().isExpandable);
	const isExpanded = $derived(expand.expandedRows.includes(normalizeRowKey(id)));
	const isBig = $derived(styled.size === 'm');

	const clickHandler = () => {
		if (disabled) return;
		// React called `toggleExpand()` and then `onExpand(toggleExpandRow(id))` with the same snapshot of the expanded rows (one toggle)
		callbacks.onExpand(expand.toggleExpandRow(id));
	};
</script>

{#if isExpandable}
	<div class="atmr-tree__button-expand" onclick={clickHandler} onkeydown={noop} role="button" tabindex="0">
		<div class="atmr-tree__icon-wrapper">
			{#if isExpanded}
				{#if styled.collapsedIcon}<Slot content={styled.collapsedIcon} />{:else if isBig}<ChevronDown />{:else}<ChevronDown16 />{/if}
			{:else if styled.expandedIcon}<Slot content={styled.expandedIcon} />{:else if isBig}<ChevronRight />{:else}<ChevronRight16 />{/if}
		</div>
	</div>
{/if}
