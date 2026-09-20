<script lang="ts">
	// Port of TableGrid/modules/selection/components/SelectionButton.tsx: the row checkbox (in the addon cell).
	// `rowConfig.selection.getRowCheckboxState(row)` can override `checked` / `indeterminate`.
	import Checkbox from '../../../Checkbox/Checkbox/Checkbox.svelte';
	import type { TableGridRowKey } from '../../types.js';
	import { normalizeRowKey } from '../../utils.js';
	import { useConfig } from '../config/config.svelte.js';
	import { useRow } from '../row/row.svelte.js';
	import { useSelection } from './selection.svelte.js';

	let { id }: { id: TableGridRowKey } = $props();

	const cfg = useConfig();
	const selection = useSelection();
	const rowContext = useRow();

	const key = $derived(normalizeRowKey(id));
	const isSelected = $derived(selection.isRowSelected(key));
	const checkboxState = $derived.by(() => {
		const data = rowContext().data;
		return data ? cfg.config.rowConfig?.selection?.getRowCheckboxState?.(data) : undefined;
	});
	const checked = $derived(checkboxState?.checked ?? isSelected);
	const indeterminate = $derived(checkboxState?.indeterminate ?? false);
</script>

<div class="atmr-tablegrid__checktree__container">
	<Checkbox
		variant="primary"
		{checked}
		{indeterminate}
		onChange={(nextChecked, wasIndeterminate) => selection.setRowSelected(key, Boolean(wasIndeterminate || nextChecked))}
		onclick={(event: MouseEvent) => event.stopPropagation()}
	/>
</div>
