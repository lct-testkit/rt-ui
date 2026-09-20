<script lang="ts">
	// Story: TableGrid/TableGrid/ExpandableTable (ExpandableTable.stories.tsx)
	// Nested tables of any depth with row selection that cascades down (a checked parent checks all its children) and up
	// (a parent is checked / indeterminate depending on its children). `selections` = { [tableKey]: selected row ids }, tableKey = 'root' | 'root:<rowId>' | ...
	/* eslint-disable @typescript-eslint/no-explicit-any */
	import Checkbox from '$lib/components/Checkbox/Checkbox/Checkbox.svelte';
	import TableGrid from '$lib/components/TableGrid/TableGrid.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import Sp from '../_utils/Sp.svelte';
	import { DEFAULT_COLUMNS, ROWS } from './_fixtures.js';

	type Selections = Record<string, string[]>;
	const accent = { color: 'var(--atmr-accent-500)' };
	const pb = { paddingBottom: 'var(--atmr-spacing-3x)' };
	const EMPTY_SELECTION: string[] = [];

	const getParentInfo = (tableKey: string) => {
		if (tableKey === 'root') return null;
		const lastColon = tableKey.lastIndexOf(':');
		return { parentTableKey: tableKey.slice(0, lastColon), parentRowId: tableKey.slice(lastColon + 1) };
	};
	const getRowsByTableKey = (tableKey: string): any[] => {
		if (tableKey === 'root') return ROWS;
		const info = getParentInfo(tableKey);
		if (!info) return [];
		const parentRow = getRowsByTableKey(info.parentTableKey).find((row) => String(row.id) === info.parentRowId);
		return parentRow?.children ?? [];
	};
	const getRowForChildTableKey = (childTableKey: string) => {
		const info = getParentInfo(childTableKey);
		if (!info) return null;
		return getRowsByTableKey(info.parentTableKey).find((row) => String(row.id) === info.parentRowId) ?? null;
	};
	const countDescendantSelection = (row: any, tableKey: string, selections: Selections): { total: number; selected: number } => {
		const children: any[] = row.children ?? [];
		if (children.length === 0) return { total: 0, selected: 0 };
		const childKey = tableKey + ':' + row.id;
		const childSelected = new Set(selections[childKey] ?? []);
		return children.reduce(
			(acc, child) => {
				const childId = String(child.id);
				const nested = countDescendantSelection(child, childKey, selections);
				const hasNested = (child.children?.length ?? 0) > 0;
				const isSelected = hasNested ? nested.total > 0 && nested.selected === nested.total : childSelected.has(childId);
				return { total: acc.total + 1 + nested.total, selected: acc.selected + (isSelected ? 1 : 0) + nested.selected };
			},
			{ total: 0, selected: 0 }
		);
	};
	const getRowCheckboxState = (row: any, tableKey: string, selections: Selections) => {
		const children: any[] = row.children ?? [];
		const rowId = String(row.id);
		if (children.length === 0) return { checked: (selections[tableKey] ?? []).includes(rowId), indeterminate: false };
		const { total, selected } = countDescendantSelection(row, tableKey, selections);
		if (selected === 0) return { checked: false, indeterminate: false };
		if (selected === total) return { checked: true, indeterminate: false };
		return { checked: false, indeterminate: true };
	};
	const syncAncestors = (selections: Selections, tableKey: string): Selections => {
		let result = selections;
		let currentKey = tableKey;
		while (currentKey !== 'root') {
			const parentRow = getRowForChildTableKey(currentKey);
			if (parentRow && (parentRow.children?.length ?? 0) > 0) {
				const info = getParentInfo(currentKey);
				if (info) {
					const { total, selected } = countDescendantSelection(parentRow, info.parentTableKey, result);
					const current = result[info.parentTableKey] ?? [];
					const rowId = String(parentRow.id);
					if (selected === total && total > 0) {
						if (!current.includes(rowId)) result = { ...result, [info.parentTableKey]: [...current, rowId] };
					} else if (current.includes(rowId)) {
						result = { ...result, [info.parentTableKey]: current.filter((id) => id !== rowId) };
					}
				}
			}
			const info = getParentInfo(currentKey);
			if (!info) break;
			currentKey = info.parentTableKey;
		}
		return result;
	};
	const applyCascadeSelect = (selections: Selections, tableKey: string, row: any): Selections => {
		const children: any[] = row.children ?? [];
		if (children.length === 0) return selections;
		const childKey = tableKey + ':' + row.id;
		const next = { ...selections, [childKey]: children.map((child) => String(child.id)) };
		return children.reduce((acc, child) => applyCascadeSelect(acc, childKey, child), next);
	};
	const applyCascadeDeselect = (selections: Selections, tableKey: string, row: any): Selections => {
		const children: any[] = row.children ?? [];
		if (children.length === 0) return selections;
		const childKey = tableKey + ':' + row.id;
		const next = { ...selections, [childKey]: [] };
		return children.reduce((acc, child) => applyCascadeDeselect(acc, childKey, child), next);
	};
	const applySelectionChangeWithCascade = (prev: Selections, tableKey: string, rows: any[], prevSelected: string[], nextSelected: string[]): Selections => {
		let updates: Selections = { ...prev, [tableKey]: nextSelected };
		const added = nextSelected.filter((id) => !prevSelected.includes(id));
		const removed = prevSelected.filter((id) => !nextSelected.includes(id));
		added.forEach((id) => {
			const row = rows.find((item) => String(item.id) === id);
			if (row) updates = applyCascadeSelect(updates, tableKey, row);
		});
		removed.forEach((id) => {
			const row = rows.find((item) => String(item.id) === id);
			if (row) updates = applyCascadeDeselect(updates, tableKey, row);
		});
		return syncAncestors(updates, tableKey);
	};
	const applyHeaderSelectAll = (prev: Selections, tableKey: string, rows: any[]): Selections => {
		let updates: Selections = { ...prev, [tableKey]: rows.map((row) => String(row.id)) };
		rows.forEach((row) => {
			updates = applyCascadeSelect(updates, tableKey, row);
		});
		return syncAncestors(updates, tableKey);
	};
	const applyHeaderClearAll = (prev: Selections, tableKey: string, rows: any[]): Selections => {
		let updates: Selections = { ...prev, [tableKey]: [] };
		rows.forEach((row) => {
			updates = applyCascadeDeselect(updates, tableKey, row);
		});
		return syncAncestors(updates, tableKey);
	};
	const buildSelectionsWithCascade = (rows: any[], tableKey: string, selections: Selections): Selections => {
		let result: Selections = { ...selections };
		const selected = result[tableKey] ?? [];
		selected.forEach((id) => {
			const row = rows.find((item) => String(item.id) === id);
			if (row) result = applyCascadeSelect(result, tableKey, row);
		});
		rows.forEach((row) => {
			const children: any[] = row.children ?? [];
			if (children.length > 0) {
				const childKey = tableKey + ':' + row.id;
				if (result[childKey] !== undefined) result = buildSelectionsWithCascade(children, childKey, result);
			}
		});
		return syncAncestors(result, tableKey);
	};
	const getHeaderCheckboxState = (rows: any[], tableKey: string, selections: Selections) => {
		if (rows.length === 0) return { checked: false, indeterminate: false };
		const states = rows.map((row) => getRowCheckboxState(row, tableKey, selections));
		const allChecked = states.every((state) => state.checked);
		const someActive = states.some((state) => state.checked || state.indeterminate);
		return { checked: allChecked, indeterminate: someActive && !allChecked };
	};

	const initialExpandedKeys = ['1'];
	let selections = $state<Selections>(buildSelectionsWithCascade(ROWS, 'root', { root: ['1'] }));

	// React: getSelection(tableKey, rows) -> rowConfig.selection (without the header snippet, see `nestedTable` / the root table)
	const getSelection = (tableKey: string, rows: any[]) => ({
		defaultSelected: selections[tableKey] ?? EMPTY_SELECTION,
		getRowCheckboxState: (row: any) => getRowCheckboxState(row, tableKey, selections),
		onSelectionChange: (nextSelected: string[]) => {
			selections = applySelectionChangeWithCascade(selections, tableKey, rows, selections[tableKey] ?? [], nextSelected);
		}
	});
	const hasExpanded = (row: any) => (row.children?.length ?? 0) > 0;
	const onHeaderChange = (tableKey: string, rows: any[], checked: boolean, wasIndeterminate: boolean) => {
		selections = wasIndeterminate || checked ? applyHeaderSelectAll(selections, tableKey, rows) : applyHeaderClearAll(selections, tableKey, rows);
	};
</script>

<!-- the header checkbox of the table `tableKey` (nested tables hide their header, so it is only visible for the root table) -->
{#snippet headerCheckbox(tableKey: string, rows: any[])}
	{@const state = getHeaderCheckboxState(rows, tableKey, selections)}
	<Checkbox onChange={(checked, wasIndeterminate) => onHeaderChange(tableKey, rows, checked, wasIndeterminate)} checked={state.checked} indeterminate={state.indeterminate} variant="primary" />
{/snippet}

<!-- nested table of the row `row` of the table `tableKey` (React createExpandConfig().render) -->
{#snippet nestedTable(tableKey: string, depth: number, row: any)}
	{@const childKey = tableKey + ':' + row.id}
	{@const children = row.children ?? []}
	{#snippet childHeader()}{@render headerCheckbox(childKey, children)}{/snippet}
	{#snippet childExpanded(childRow: any)}{@render nestedTable(childKey, depth + 1, childRow)}{/snippet}
	<div style="width: 100%">
		<TableGrid
			nestedOffset={depth}
			columns={DEFAULT_COLUMNS}
			rows={children}
			hide={{ header: true }}
			less
			rowConfig={{
				selection: { ...getSelection(childKey, children), renderFirstColumnHeader: childHeader },
				expand: { hasExpanded, render: childExpanded }
			}}
		/>
	</div>
{/snippet}

{#snippet rootHeader()}{@render headerCheckbox('root', ROWS)}{/snippet}
{#snippet rootExpanded(row: any)}{@render nestedTable('root', 1, row)}{/snippet}

<div style="align-items: flex-start">
	<Typography variant="body-m" style={pb}
		>В данном примере раскрывающихся строк мы проверяем в функции<Sp /><Typography as="span" variant="body-m" style={accent}>hasExpanded</Typography>, что в переданной строке есть<Sp /><Typography
			as="span"
			variant="body-m"
			style={accent}>children</Typography
		>. В случае, если условие выполняется, рисуем подтаблицу с новыми данными</Typography
	>

	<Typography variant="body-m" style={pb}
		>Режимы<Sp /><Typography as="span" variant="body-m" style={accent}>expand</Typography><Sp />и<Sp /><Typography as="span" variant="body-m" style={accent}>selection</Typography><Sp />работают на всех
		уровнях вложенности. Во второй строке вложенной таблицы есть второй уровень expand.</Typography
	>

	<TableGrid
		columns={DEFAULT_COLUMNS}
		rows={ROWS}
		rowConfig={{
			selection: { ...getSelection('root', ROWS), renderFirstColumnHeader: rootHeader },
			expand: { expandedKeys: initialExpandedKeys, hasExpanded, render: rootExpanded }
		}}
	/>
</div>
