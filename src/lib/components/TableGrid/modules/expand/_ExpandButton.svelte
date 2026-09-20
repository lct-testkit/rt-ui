<script lang="ts">
	// Port of shared/modules/expand/components/ExpandButton.tsx: the chevron of an expandable row (in the addon cell).
	// A non-expandable row gets an invisible placeholder when the table also has selection checkboxes (keeps the columns aligned).
	// NOTE (React quirk kept): the big (24px) chevrons are used only when the `size` PROP is explicitly 'm', otherwise the 16px ones.
	import ChevronDown from '../../../../icons/24/navigation/ChevronDown.svelte';
	import ChevronDown16 from '../../../../icons/16/navigation/ChevronDown16.svelte';
	import ChevronRight from '../../../../icons/24/navigation/ChevronRight.svelte';
	import ChevronRight16 from '../../../../icons/16/navigation/ChevronRight16.svelte';
	import { noop } from '../../../../utils/noop.js';
	import type { TableGridRowKey } from '../../types.js';
	import { normalizeRowKey } from '../../utils.js';
	import { useConfig, useConfigEnabledModes } from '../config/config.svelte.js';
	import { useRow } from '../row/row.svelte.js';
	import { useExpand } from './expand.svelte.js';

	let { id }: { id: TableGridRowKey } = $props();

	const cfg = useConfig();
	const modes = useConfigEnabledModes();
	const expand = useExpand();
	const rowContext = useRow();

	const isExpandable = $derived(!!rowContext().isExpandable);
	const isExpanded = $derived(expand.isRowExpanded(normalizeRowKey(id)));
	const isBig = $derived(cfg.config.size === 'm');

	const onClick = (e: MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		expand.toggleExpandRow(id);
	};
</script>

{#if !isExpandable}
	{#if modes.isSelectionModeEnabled}
		<div class="atmr-tablegrid__expand__icon atmr-tablegrid__expand__icon--placeholder" aria-hidden="true"></div>
	{/if}
{:else}
	<div class="atmr-tablegrid__expand__icon" onclick={onClick} onkeydown={noop} role="button" tabindex="0">
		{#if isExpanded}
			{#if isBig}<ChevronDown />{:else}<ChevronDown16 />{/if}
		{:else if isBig}<ChevronRight />{:else}<ChevronRight16 />{/if}
	</div>
{/if}
