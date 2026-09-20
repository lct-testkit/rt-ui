<script lang="ts" generics="T extends TableGridRow = TableGridRow">
	// Port of packages/tablegird/src/components/TableGrid/TableGrid.tsx (the Rostelecom "Atomaro" data table).
	//
	// USAGE / API: see ./README.md. Types: ./types.ts. Props have the React names (`className` -> `class`); React render functions became
	// snippets / `Content` (`column.render(row)` -> `Snippet<[row]>`, `renders.footer()` -> snippet | string).
	//
	// ARCHITECTURE (React: providers + hooks; here: one Svelte context per feature, all created in this component, in the React nesting
	// order). Every feature lives in ./modules/<feature>/ and talks to the others only through contexts, so features can be
	// added / changed in parallel without touching each other:
	//
	//   modules/config          props -> `config`, enabled modes, the shared `cache` (state that survives re-mounts of nested tables)
	//   modules/layout          template columns + CSS grid variables, column highlight; _Layout (grid root), _LayoutRow, _LayoutColumns
	//   modules/expand          expandable rows: expanded keys + `_ExpandButton` / `_ExpandContainer` (nested tables)
	//   modules/rows            rows + rowConfig -> row states (position, colours, click / highlight, infinite scroll trigger)
	//   modules/row             `useRow()` context of the row being rendered (`_RowProvider`)
	//   modules/selection       row selection (checkboxes, select all through `renderFirstColumnHeader`), `useSelection()`
	//   modules/resize          column resize (mouse), `_ResizableBlock`
	//   modules/dnd             column move (drag and drop), `_DndButton`
	//   modules/sorting         sort buttons in the header (`_SortingButton`), sorting itself is up to the consumer
	//   modules/filter          column filters (popover / inline; select, operators, custom), `_ColumnFilter`
	//   modules/header          `_TableHeader` (header row) + `_HeaderCell`
	//   modules/body            `_TableBody` (rows list, virtual list), `_TableRow` (data row + infinite scroll trigger), `_EmptyTable`
	//   modules/cell            `_ContentCell` (body cell)
	//   modules/header-bar      `renders.extraHeader` bar; `renders.extraBar` is rendered here (TableGrid.svelte)
	//   modules/footer-area     `renders.footer` + `renders.actionBar` area (pagination goes into the footer slot)
	//   modules/action-bar      `ActionBar` (public): ready-made "N selected / delete / cancel" bar for `renders.actionBar`
	//   modules/infinite-scroll `inView` action (IntersectionObserver, replaces react-cool-inview); the trigger is rendered by `_TableRow`
	//   modules/sticky          `--offset-sticky` computation (sticky header / footer / bars themselves are CSS)
	//   modules/virtual         `virtual` rows: only the visible window of the rows is rendered into the grid (virtua core + CSS subgrid)
	//
	// `shared/*` of the React package (config, layout, expand, row, rows) is also what the Tree component is built on: a Tree port
	// creates the same contexts and renders `_TableBody` with its own row snippet (`component: 'tree'`).
	//
	// Files starting with `_` are internal building blocks (not exported by the generated barrel).
	import clsx from 'clsx';
	import { createTableMotion } from '../../ext/tableMotion.svelte.js';
	import Slot from '../../internal/Slot.svelte';
	import { styleToString } from '../../utils/style.js';
	import { TABLEGRID_SIZES, TABLEGRID_VARIANTS } from './constants.js';
	import EmptyTable from './modules/body/_EmptyTable.svelte';
	import TableBody from './modules/body/_TableBody.svelte';
	import TableRow from './modules/body/_TableRow.svelte';
	import { createConfigContext } from './modules/config/config.svelte.js';
	import { createDndContext } from './modules/dnd/dnd.svelte.js';
	import { createExpandContext } from './modules/expand/expand.svelte.js';
	import { createFilterContext } from './modules/filter/filter.svelte.js';
	import FooterArea from './modules/footer-area/_FooterArea.svelte';
	import TableHeader from './modules/header/_TableHeader.svelte';
	import HeaderBar from './modules/header-bar/_HeaderBar.svelte';
	import { createLayoutContext } from './modules/layout/layout.svelte.js';
	import Layout from './modules/layout/_Layout.svelte';
	import { createResizeContext } from './modules/resize/resize.svelte.js';
	import { createRowsContext } from './modules/rows/rows.svelte.js';
	import { createSelectionContext } from './modules/selection/selection.svelte.js';
	import { createSortingContext } from './modules/sorting/sorting.svelte.js';
	import { EXTRA_HEADER_HEIGHT, getStickyHeaderOffset } from './modules/sticky/offsets.js';
	import type { TableGridHeaderBarProps, TableGridProps, TableGridRow } from './types.js';

	let props: TableGridProps<T> = $props();

	// The modules read the raw props through the config context (like React's `ConfigProvider config={props}`).
	createConfigContext(() => props);
	createLayoutContext();
	createExpandContext();
	createRowsContext();
	createSelectionContext();
	createResizeContext();
	createDndContext();
	createFilterContext();
	createSortingContext();
	// [ext, not in original] the author's motion of the table (off by default: nothing below reads it until `motion` / an ExtMotionProvider switches it on);
	// see src/lib/ext/tableMotion.svelte.ts. Not for `virtual` tables (the window of rows changes on every scroll step).
	createTableMotion({ prop: () => props.motion, virtual: () => !!props.virtual?.isEnable, rowCount: () => props.rows?.length ?? 0 });

	const size = $derived(props.size ?? TABLEGRID_SIZES.m);
	const variant = $derived(props.variant ?? TABLEGRID_VARIANTS.primary);
	const nestedOffset = $derived(props.nestedOffset ?? 0);
	const isShowHeader = $derived(!props.hide?.header);
	const isEmpty = $derived(!props.rows || props.rows.length === 0);

	const renders = $derived(props.renders);
	const footerRender = $derived(renders?.footer);
	const extraBarRender = $derived(renders?.extraBar);
	const extraHeaderRender = $derived(renders?.extraHeader);
	const extraHeaderProps = $derived<TableGridHeaderBarProps>(typeof extraHeaderRender === 'function' ? extraHeaderRender() : (extraHeaderRender ?? {}));
	const hasExtraBar = $derived(!!extraBarRender);
	const hasExtraHeader = $derived(!!extraHeaderRender);

	const offsetStickyHeader = $derived(
		getStickyHeaderOffset({
			headerSticky: props.headerSticky,
			extraBar: hasExtraBar,
			extraBarSticky: props.extraBarSticky,
			extraHeader: hasExtraHeader,
			extraHeaderSticky: props.extraHeaderSticky,
			containerStyle: props.containerStyle,
			style: props.style
		})
	);

	const rootClassName = $derived(
		clsx(
			'atmr-tablegrid',
			`atmr-tablegrid--size-${TABLEGRID_SIZES[size]}`,
			`atmr-tablegrid--variant-${TABLEGRID_VARIANTS[variant]}`,
			{
				'atmr-tablegrid--withBorders': !props.less,
				'atmr-tablegrid--header-sticky': props.headerSticky,
				'atmr-tablegrid--with-extra-top': hasExtraHeader,
				'atmr-tablegrid--empty': isEmpty,
				'atmr-tablegrid--nested': nestedOffset > 0
			},
			props.class
		)
	);
	const rootStyle = $derived(
		styleToString(
			{
				'--offset-sticky': `${offsetStickyHeader}px`,
				'--extra-header-sticky-offset': hasExtraHeader && props.extraHeaderSticky ? `${EXTRA_HEADER_HEIGHT}px` : '0px'
			},
			props.style
		)
	);
	const extraBarClassName = $derived(clsx('atmr-tablegrid__extrabar__container', { 'atmr-tablegrid__extrabar__container--sticky': props.extraBarSticky }));
</script>

<div class={rootClassName} style={rootStyle}>
	{#if hasExtraHeader}
		<div class={clsx('atmr-tablegrid__header__container', { 'atmr-tablegrid__header__container--sticky': props.extraHeaderSticky })}>
			<HeaderBar {...extraHeaderProps} />
		</div>
	{/if}
	{#if hasExtraBar}
		{#if hasExtraHeader}
			<div class={extraBarClassName}><Slot content={extraBarRender} /></div>
		{:else}
			<div class="atmr-tablegrid__header__container">
				<div class={extraBarClassName}><Slot content={extraBarRender} /></div>
			</div>
		{/if}
	{/if}
	<Layout id={props.id ?? 'default'} style={props.containerStyle}>
		{#if isShowHeader}<TableHeader />{/if}
		{#if isEmpty}<EmptyTable content={renders?.emptyTable} />{/if}
		<TableBody><TableRow /></TableBody>
		{#if footerRender || renders?.actionBar}
			<FooterArea footerSticky={props.footerSticky ?? false} {footerRender} renderActionBar={renders?.actionBar} />
		{/if}
	</Layout>
</div>
