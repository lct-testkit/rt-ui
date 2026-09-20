<script lang="ts">
	// Port of TableGrid/modules/filter/components/ColumnFilter.tsx.
	// Calls `children(buttons)` where `buttons` is a snippet (or null for a column without `filter`) that the header cell renders
	// where it wants (React: `render(buttons)`):
	//   * position 'popover' (default): a filter button (FunctionButton) that opens a Popover with the filter,
	//   * position 'inline': the filter itself (Select / operators input / custom `filter.render`).
	// Filter types: 'select' (ui-kit Select), 'operators' (Input + operator DropdownMenu), custom `filter.render`.
	import { onMount, untrack, type Snippet } from 'svelte';
	import Filter16 from '../../../../icons/16/action/Filter16.svelte';
	import FilterFill16 from '../../../../icons/16/action/FilterFill16.svelte';
	import Slot from '../../../../internal/Slot.svelte';
	import FunctionButton from '../../../Button/FunctionButton/FunctionButton.svelte';
	import DropdownMenu from '../../../DropdownMenu/DropdownMenu.svelte';
	import type { DropdownMenuItem } from '../../../DropdownMenu/types.js';
	import Input from '../../../Input/Input.svelte';
	import Popover from '../../../Popover/Popover.svelte';
	import Select from '../../../Select/Select.svelte';
	import { DEFAULT_OPERATORS_LIST } from './operators.js';
	import type { TableGridOperator } from '../../types.js';
	import { useFilterContext, useFilterController } from './filter.svelte.js';

	let { colKey, children }: { colKey: string; children: Snippet<[Snippet | null]> } = $props();

	const filterContext = useFilterContext();
	const controller = useFilterController(() => colKey);
	const filter = $derived(controller.filter);

	let activeOperator = $state<TableGridOperator>(DEFAULT_OPERATORS_LIST[0].key);
	let filterValue = $state<string | undefined>(untrack(() => controller.filter?.value));

	// useEffect(..., [valueProp])
	$effect.pre(() => {
		const valueProp = filter?.value;
		if (valueProp || valueProp === '') filterValue = valueProp;
	});

	// REACT TIMING QUIRKS that show in the DOM of the closed popups (reproduced on purpose, they have no visual effect):
	//  1. React creates the Popper instance of a closed menu on the SECOND render of its owner (refs are `undefined` during the first one), i.e.
	//     after the `hide()` effect of the first render already ran, so the closed instance keeps Popper's default scroll / resize listeners.
	//     `bodyReady` (= one flush after mount) is used the same way for the operators menu: `lazy: !bodyReady`.
	//  2. usePopper's `useTheme` swaps the wrapper component of the portalled popover content one commit after the first render, so React
	//     re-creates that content and the nodes it portals to <body> (the menu of a `select` filter) come after those of the inline filters.
	//     The popover body is mounted one flush after the header to get the same <body> order.
	//  3. The Select inside the (display: none) popover has no Popper instance yet (its `trigger` = `offsetParent` is null): `lazy: true`;
	//     an inline Select is laid out and has its instance from the start (Select's default `lazy: false`).
	let bodyReady = $state(false);
	onMount(() => {
		bodyReady = true;
	});

	const isInlinePositionFilter = $derived(filter?.position === 'inline');
	const isSelectFilter = $derived(filter?.type === 'select');
	const isOpen = $derived(filterContext.openFilter === colKey);
	const items = $derived(DEFAULT_OPERATORS_LIST.map((item) => ({ ...item, isSelected: item.key === activeOperator })) as DropdownMenuItem[]);
	const activeOperatorItem = $derived(DEFAULT_OPERATORS_LIST.find((o) => o.key === activeOperator));

	const onFilter = (value: string) => {
		if (!filter?.value) filterValue = value;
		if (filter?.onFilter) {
			if (isSelectFilter) return filter.onFilter(value);
			return filter.onFilter(value, activeOperator);
		}
		return null;
	};
	const toggleIsOpen = (e: Event) => {
		e.stopPropagation();
		e.preventDefault();
		filterContext.setOpenFilter(isOpen ? null : colKey);
	};
	const open = (e: Event) => {
		e.stopPropagation();
		filterContext.setOpenFilter(colKey);
	};
	const close = () => filterContext.setOpenFilter(null);
	const onChangeOperator = (newValue: string) => {
		activeOperator = newValue as TableGridOperator;
	};
	const handleInputKeyPress = (e: KeyboardEvent) => {
		if (e.key === 'Enter' && filter?.onFilter) {
			filter.onFilter(filterValue as string, activeOperator);
			close();
		}
	};
</script>

{#snippet filterIcon()}
	{#if isOpen || filterValue}<FilterFill16 />{:else}<Filter16 />{/if}
{/snippet}

{#snippet activeOperatorIcon()}
	{#if activeOperatorItem}{@render activeOperatorItem.prefix(activeOperatorItem as DropdownMenuItem)}{/if}
{/snippet}

{#snippet filterContent()}
	{#if filter?.render}
		<Slot content={filter.render} />
	{:else if filter?.type === 'select'}
		<Select
			size={isInlinePositionFilter ? 's' : 'm'}
			items={filter.options}
			onChange={(v: string | number) => onFilter(v.toString())}
			autocomplete={{ enabled: true }}
			dropdownMenuStyle={{ zIndex: 1800 }}
			value={filterValue}
			showLabel={false}
			placement="bottomLeft"
			usePopperProps={isInlinePositionFilter ? undefined : { lazy: true }}
			useInPortal
		/>
	{:else if filter?.type === 'operators'}
		<DropdownMenu
			size="s"
			isOpened={isOpen}
			onClose={close}
			placement="bottomLeft"
			{items}
			onClickItem={(item) => onChangeOperator(item.key.toString())}
			usePopperProps={{ offset: 4, widthFitContent: true, lazy: !bodyReady }}
			useInPortal
		>
			<Input
				iconPrefix={activeOperatorIcon}
				size="s"
				onClick={open}
				onChange={(e) => (filterValue = e.target.value)}
				onClear={() => {
					onFilter('');
					activeOperator = DEFAULT_OPERATORS_LIST[0].key;
				}}
				onkeydown={handleInputKeyPress}
				value={filterValue}
				showLabel={false}
			/>
		</DropdownMenu>
	{/if}
{/snippet}

{#snippet popoverBody()}
	{#if bodyReady}{@render filterContent()}{/if}
{/snippet}

{#snippet popoverButtons()}
	<Popover isOpened={isOpen} onClose={close} placement="bottom" size="m" pointer={false} showCloseButton={false} useInPortal body={popoverBody} usePopperProps={{ offset: 4 }}>
		<FunctionButton class="atmr-tablegrid__filter__button" icon={filterIcon} variant={isOpen || filterValue ? 'primary' : 'secondary'} onclick={toggleIsOpen} />
	</Popover>
{/snippet}

{#if !filter}
	{@render children(null)}
{:else if isInlinePositionFilter}
	{@render children(filterContent)}
{:else}
	{@render children(popoverButtons)}
{/if}
