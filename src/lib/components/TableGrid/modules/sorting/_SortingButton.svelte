<script lang="ts">
	// Port of TableGrid/modules/sorting/components/SortingButton.tsx: the sort button of a header cell.
	// Icon by `sort`: desc = arrow down, asc = arrow up, default = chevrons; click -> `sorting.onSort()`.
	import FunctionButton from '../../../Button/FunctionButton/FunctionButton.svelte';
	import ArrowDown16 from '../../../../icons/16/navigation/ArrowDown16.svelte';
	import ArrowUp16 from '../../../../icons/16/navigation/ArrowUp16.svelte';
	import ChevronSort16 from '../../../../icons/16/navigation/ChevronSort16.svelte';
	import { useSortingController } from './sorting.svelte.js';

	let { id }: { id: string } = $props();

	const controller = useSortingController(() => id);
	const sort = $derived(controller.sorting?.sort);
</script>

{#snippet sortIcon()}
	{#if sort === 'desc'}<ArrowDown16 />{:else if sort === 'asc'}<ArrowUp16 />{:else if sort === 'default'}<ChevronSort16 />{/if}
{/snippet}

<FunctionButton class="atmr-tablegrid__sorting__button" icon={sortIcon} color="primary1" variant="tertiary" onclick={() => controller.sorting?.onSort?.()} />
