<script lang="ts">
	// Port of packages/tree/src/components/Tree/TreeItem/{TreeItem,useTreeItem,ButtonsList}.tsx
	//
	// One row of the tree (the row state comes from the TableGrid rows context: `data`, `id`, `level`, `isStart`, `isEnd`, `isExpandable`):
	//   <div class="atmr-tree__item ..."> LevelIndent | <div class="atmr-tree__buttons"> [toggle] [checkbox] [icon] </div> | <div class="atmr-tree__item-content">title suffix</div> </div>
	// wrapped by the scroll wrapper. Icon precedence: own `icon` of the node, else child / parent (collapsed / expanded) icons.
	import clsx from 'clsx';
	import Slot from '../../../internal/Slot.svelte';
	import type { Content } from '../../../internal/types.js';
	import { styleToString } from '../../../utils/style.js';
	import Typography from '../../Typography/Typography.svelte';
	import { useExpand } from '../../TableGrid/modules/expand/expand.svelte.js';
	import { useRow } from '../../TableGrid/modules/row/row.svelte.js';
	import { normalizeRowKey } from '../../TableGrid/utils.js';
	import { useTreeChooseRow } from '../modules/chooserow/chooserow.svelte.js';
	import { useTreeDisabled } from '../modules/disabled/disabled.svelte.js';
	import { useTreeHighlight } from '../modules/highlight/highlight.svelte.js';
	import ItemScrollWrapper from '../modules/scrollto/_ItemScrollWrapper.svelte';
	import { useTreeSelection } from '../modules/selection/selection.svelte.js';
	import SelectionButton from '../modules/selection/_SelectionButton.svelte';
	import { useTreeStyled } from '../modules/styled/styled.svelte.js';
	import ExpandButton from './_ExpandButton.svelte';
	import LevelIndent from './_LevelIndent.svelte';

	let { level: levelFromProps = 0, suffix }: { level?: number; suffix?: Content } = $props();

	const rowContext = useRow();
	const expand = useExpand();
	const choose = useTreeChooseRow();
	const styled = useTreeStyled();
	const highlight = useTreeHighlight();
	const disabledContext = useTreeDisabled();
	const selection = useTreeSelection();

	const row = $derived(rowContext());
	const data = $derived(row.data ?? { id: '' });
	const id = $derived(row.id as string);
	const level = $derived(levelFromProps + Number(row.level));
	const size = $derived(styled.size);

	const isExpandable = $derived(!!row.isExpandable);
	const isExpanded = $derived(expand.expandedRows.includes(normalizeRowKey(id)));
	const unExpandable = $derived(!isExpandable);
	const isHighlighted = $derived(highlight.highlightedKeys.includes(id));
	const isDisabled = $derived(disabledContext.disabledKeys.includes(id));
	const isSelected = $derived(choose.rowKey === id);

	type ButtonKind = 'expand' | 'select' | 'icon' | 'child' | 'parentCollapsed' | 'parentExpanded';
	const buttons = $derived.by<ButtonKind[]>(() => {
		const isChildIcon = styled.childIcon && !isExpandable;
		const isParentCollapsedIcon = isExpandable && styled.parentCollapsedIcon && !isExpanded;
		const isParentExpandedIcon = isExpandable && styled.parentExpandedIcon && isExpanded;
		const elements: ButtonKind[] = [];
		if (isExpandable) elements.push('expand');
		if (selection.checkable) elements.push('select');
		if (data.icon) {
			elements.push('icon');
		} else {
			if (isChildIcon) elements.push('child');
			if (isParentCollapsedIcon) elements.push('parentCollapsed');
			if (isParentExpandedIcon) elements.push('parentExpanded');
		}
		return elements;
	});

	const className = $derived(
		clsx('atmr-tree__item', `atmr-tree__size-${size}`, {
			'atmr-tree__variant-primary': true,
			'atmr-tree__item--selected': isSelected,
			'atmr-tree__item--highlighted': isHighlighted,
			'atmr-tree--hide-borders': styled.hideBorders,
			'atmr-tree__item--disabled': isDisabled,
			'atmr-tree__item--start': row.isStart,
			'atmr-tree__item--end': row.isEnd
		})
	);
	const style = $derived(
		styleToString({
			'--level': unExpandable ? level + 1 : level,
			'--buttons-length': buttons.length,
			'--highlight-color': styled.highlightedColor,
			'--active-color': styled.activeColor
		})
	);
</script>

{#snippet iconWrapper(icon: Content)}
	<div class="atmr-tree__icon-wrapper"><Slot content={icon} /></div>
{/snippet}

<ItemScrollWrapper {id}>
	<div class={className} {style}>
		<LevelIndent {level} {isExpandable} />
		<div class="atmr-tree__buttons">
			{#each buttons as kind (kind)}
				{#if kind === 'expand'}
					<ExpandButton {id} disabled={isDisabled} />
				{:else if kind === 'select'}
					<SelectionButton {id} disabled={isDisabled} />
				{:else if kind === 'icon'}
					{@render iconWrapper(data.icon)}
				{:else if kind === 'child'}
					{@render iconWrapper(styled.childIcon)}
				{:else if kind === 'parentCollapsed'}
					{@render iconWrapper(styled.parentCollapsedIcon)}
				{:else}
					{@render iconWrapper(styled.parentExpandedIcon)}
				{/if}
			{/each}
		</div>
		<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
		<div class="atmr-tree__item-content" onclick={() => !isDisabled && choose.onChoose(id)}>
			<Typography variant={size === 's' ? 'description-l' : 'body-s'} style={{ padding: '0px', margin: '0px' }}><Slot content={data.title || data.name} /></Typography>
			{#if suffix}<Slot content={suffix} />{/if}
		</div>
	</div>
</ItemScrollWrapper>
