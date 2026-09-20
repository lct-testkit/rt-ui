<script lang="ts">
	// Port of shared/modules/row/components/Row.tsx: one data row = the `div.atmr-tablegrid__row` (cells + expand / selection controls)
	// followed - for the LAST row only - by the infinite scroll trigger element (`display: contents` wrapper with a full-width
	// grid item; observed by IntersectionObserver, or showing the loader / the "load more" action).
	import Loader from '../../../Loader/Loader.svelte';
	import Slot from '../../../../internal/Slot.svelte';
	import { useConfigEnabledModes } from '../config/config.svelte.js';
	import ExpandButton from '../expand/_ExpandButton.svelte';
	import { inView } from '../infinite-scroll/inView.js';
	import LayoutColumns from '../layout/_LayoutColumns.svelte';
	import LayoutRow from '../layout/_LayoutRow.svelte';
	import { useRow } from '../row/row.svelte.js';
	import { useRows } from '../rows/rows.svelte.js';
	import SelectionButton from '../selection/_SelectionButton.svelte';

	const rowContext = useRow();
	const rows = useRows();
	const modes = useConfigEnabledModes();

	const row = $derived(rowContext());
	const id = $derived(row.id as string | number);
	const isHighlighted = $derived(rows.isHighlightEnabled && rows.highlighted === row.id);
	const infiniteScroll = $derived(row.infiniteScroll);
</script>

<LayoutRow {isHighlighted} position={row.position}>
	<LayoutColumns>
		{#if modes.isExpandableModeEnabled}
			<!-- a non-expandable row only gets the invisible placeholder of the chevron (see ExpandButton) - no component for it -->
			{#if row.isExpandable}<ExpandButton {id} />{:else if modes.isSelectionModeEnabled}<div class="atmr-tablegrid__expand__icon atmr-tablegrid__expand__icon--placeholder" aria-hidden="true"></div>{/if}
		{/if}
		{#if modes.isSelectionModeEnabled}<SelectionButton {id} />{/if}
	</LayoutColumns>
</LayoutRow>
{#if infiniteScroll}
	<div style="--row-index: {row.triggerPosition ?? +id + 100}; display: contents">
		<div
			style="grid-row-start: var(--row-index); grid-column: 1 / -1"
			use:inView={{
				enabled: !infiniteScroll.isLoadOnAction,
				onEnter: ({ unobserve }) => {
					unobserve();
					infiniteScroll.loadMore();
				}
			}}
		>
			{#if infiniteScroll.isLoadOnAction && !infiniteScroll.isLoading}
				{#if infiniteScroll.action}{@render infiniteScroll.action(infiniteScroll.loadMore)}{/if}
			{:else if !infiniteScroll.loader && infiniteScroll.isLoading}
				<div style="width: 100%; display: flex; justify-content: center; padding: var(--atmr-spacing-2x) 0"><Loader /></div>
			{:else if infiniteScroll.isLoading}
				<Slot content={infiniteScroll.loader} />
			{/if}
		</div>
	</div>
{/if}
