# TableGrid

Data table of the Atomaro design system: sorting / filter buttons in the header, column resize and move, row selection,
expandable rows (nested tables), row colours, sticky header / footer, extra bars, action bar, pagination footer, infinite scroll. Port of
`@atomaro/tablegrid` — same props, same DOM and classes as the React component.

```svelte
<script lang="ts">
  import { TableGrid, ActionBar, useSelection, type TableGridColumn, type TableGridRow } from '$lib/components/TableGrid';
</script>
```

Files starting with `_` are internal. Architecture (one folder per feature under `modules/`) is described in the header comment
of `TableGrid.svelte`.

## Contents

[Props](#props) · [Example 1 - sorting, selection, action bar](#example-1---sorting-controlled-selection-action-bar-footer) · [Example 2 - custom cells, row colours](#example-2---custom-cells-row-colours-highlight-on-click) ·
[Example 3 - expandable rows, title bar](#example-3---expandable-rows-title-bar-extra-bar) · [Filters](#filters) · [Sticky header / footer / first column](#sticky-header--footer--first-column) ·
[Pagination](#pagination) · [Expandable rows and nested tables](#expandable-rows-and-nested-tables) · [Action bars](#action-bars) · [Infinite scroll](#infinite-scroll) · [Производительность](#производительность) · [Анимации (вне оригинала)](#анимации-вне-оригинала) · [Notes](#notes--deviations-from-react)

## Props

| prop | type | default | |
|---|---|---|---|
| `columns` | `TableGridColumn[]` | required | columns (see below) |
| `rows` | `TableGridRow[]` | required | rows: objects with a unique `id` (or the field named in `rowConfig.key`) |
| `id` | `string` | `'default'` | table id; **required and unique for nested tables** |
| `size` | `'s' \| 'm'` | `'m'` | |
| `variant` | `'primary'` | `'primary'` | |
| `class` / `style` | `string` / CSS string or object | | root element (React `className`, `style`) |
| `containerStyle` | CSS string or object | | the scrolling grid: `{ width: 1000, maxHeight: 500 }` makes the table scroll inside |
| `less` | `boolean` | `false` | no outer border (nested tables) |
| `nestedOffset` | `number` | `0` | indent of the first column, `1`, `2` .. for nested tables |
| `columnConfig` | `{ sorting, filter, move, resize }` (booleans) | | switches the header features on |
| `rowConfig` | `TableGridRowConfig` | | see below |
| `renders` | `{ footer, actionBar, extraBar, extraHeader, emptyTable }` | | slots, see below |
| `infiniteScroll` | `{ loadMore, loading, onLoadMore, action?, loader? }` | | see [Infinite scroll](#infinite-scroll) |
| `headerSticky` / `footerSticky` / `addonSticky` / `extraHeaderSticky` / `extraBarSticky` | `boolean` | `false` | sticky header row / footer / first column / title bar / extra bar, see [Sticky](#sticky-header--footer--first-column) |
| `alignCells` | `boolean` | `false` | **[ext, not in original]** body cells follow `column.align` (in the original `align` only affects the header cell) |
| `hide` | `{ header?: boolean }` | | hides the header row |
| `onCollsResize` | `(colName, width) => void` | | column resized |
| `onCollsSwap` | `(from, to) => void` | | column moved |
| `virtual` | `{ isEnable, overscanCount }` | | virtual list: only the visible rows are in the DOM, see [Производительность](#производительность) |
| `motion` | `boolean \| 'tween' \| 'spring' \| { duration, easing, delay, rows, expand, actionBar, icons, highlight, hover, maxRows, maxExpandRows }` | inherits `ExtMotionProvider` (off without one) | **[ext, not in original]** animations of the table, see [Анимации (вне оригинала)](#анимации-вне-оригинала) |

### `TableGridColumn`

`name` (unique) · `title` · `key` (row field, default `name`) · `unit` · `size: { width, min, max }` (`width`: number = px, or a CSS
string `'200px'` / `'1fr'`; `min` / `max` numbers limit the mouse resize) · `align: 'left' | 'right'` · `textWrap` · `stickyEnd` (stick to the right) ·
`render: Snippet<[row]>` (custom cell) · `sorting: { sort: 'asc' | 'desc' | 'default', onSort }` · `filter` (see [Filters](#filters)).

A cell shows `row[key]`; if that value is `{ content, warning?, error? }` the `content` is shown and `warning` / `error` colour the cell.
The table does **not** sort or filter anything: it shows the state you pass (`sort`, `value`) and calls `onSort()` / `onFilter(value)`.

### `rowConfig`

`key` (id field) · `onClick(id)` · `onDoubleClick(id)` · `highlightOnClick` · `highlightColor` / `backgroundColor` / `borderBottom` (string or `(row) => string`) ·
`expand: { hasExpanded(row), render: Snippet<[row]>, expandedKeys }` · `selection: { defaultSelected, onSelect(key), onSelectionChange(keys), renderFirstColumnHeader, getRowCheckboxState(row) }`.

* selection is **uncontrolled** with `defaultSelected` (initial value, re-applied when it changes) and **controlled** with `defaultSelected` + `onSelectionChange`;
  keys are strings (`String(row.id)`);
* `renderFirstColumnHeader` is the content of the first header cell (usually a "select all" checkbox), `[]` as `defaultSelected` is enough to switch selection on.

### `renders` (slots)

| slot | shows |
|---|---|
| `footer` | bottom area of the table (pagination, totals ...), see [Pagination](#pagination) |
| `actionBar` | panel above the footer, rendered only while at least one row is selected, see [Action bars](#action-bars) |
| `extraHeader` | title bar above the table: `() => ({ title, content })` (or the object); `content` is a snippet / string |
| `extraBar` | bar between the title bar and the table (filters, tags ...) |
| `emptyTable` | content shown when `rows` is empty (default: the text "Таблица пуста") |

### React function -> Svelte

| React | Svelte |
|---|---|
| `render: (row) => <X/>` (column, `expand`) | `{#snippet cell(row)}...{/snippet}` and `render: cell` |
| `renders.footer / actionBar / extraBar / emptyTable: () => <X/>` | `{#snippet footer()}...{/snippet}` and `renders={{ footer }}` (a string works too) |
| `renders.extraHeader: () => ({ title, content })` | `extraHeader: () => ({ title, content })` (or the object); `content` is a snippet / string |
| `renderFirstColumnHeader: () => <X/>`, `filter.render`, `infiniteScroll.loader` | a snippet / string |
| `infiniteScroll.action: (loadMore) => <X/>` | `{#snippet action(loadMore)}...{/snippet}` |
| `useSelection()` inside the table | `useSelection()` in a component rendered inside the table (e.g. in the `actionBar` snippet) |

`rows` / `columns` may be `$state`, `$state.raw` or `$derived` (`$state.raw` is the cheapest for big lists). Keep `rows` ids unique; like React the table
tolerates duplicate ids (every row is rendered, selection / expand state of rows with the same id is shared). Generic: `TableGridColumn<Row>` types the row of `render`.

## Example 1 - sorting, controlled selection, action bar, footer

```svelte
<script lang="ts">
  import { TableGrid, ActionBar, type TableGridColumn, type TableGridRow } from '$lib/components/TableGrid';
  import Checkbox from '$lib/components/Checkbox/Checkbox/Checkbox.svelte';

  interface Client extends TableGridRow { id: number; name: string; amount: number }
  let { clients }: { clients: Client[] } = $props();

  let sort = $state<'asc' | 'desc' | 'default'>('default');
  let selected = $state<string[]>([]);
  const rows = $derived(sort === 'default' ? clients : [...clients].sort((a, b) => (sort === 'asc' ? a.amount - b.amount : b.amount - a.amount)));
  const columns: TableGridColumn<Client>[] = $derived([
    { name: 'name', title: 'Client', size: { width: 220 } },
    { name: 'amount', title: 'Sum', unit: '$', align: 'right', sorting: { sort, onSort: () => (sort = sort === 'default' ? 'asc' : sort === 'asc' ? 'desc' : 'default') } }
  ]);
</script>

{#snippet selectAll()}
  <Checkbox variant="primary" checked={selected.length === clients.length} indeterminate={selected.length > 0 && selected.length < clients.length}
    onChange={(v) => (selected = v ? clients.map((c) => String(c.id)) : [])} />
{/snippet}
{#snippet actionBar()}<ActionBar onDelete={(keys) => remove(keys)} />{/snippet}
{#snippet footer()}Total: {clients.length}{/snippet}

<TableGrid {columns} {rows} columnConfig={{ sorting: true }} headerSticky containerStyle={{ maxHeight: 400 }}
  rowConfig={{ selection: { defaultSelected: selected, onSelectionChange: (keys) => (selected = keys), renderFirstColumnHeader: selectAll } }}
  renders={{ footer, actionBar }} />
```

## Example 2 - custom cells, row colours, highlight on click

```svelte
{#snippet status(row: Client)}<Tag label={row.status} />{/snippet}

<TableGrid size="s" rows={clients}
  columns={[{ name: 'name', title: 'Client' }, { name: 'status', title: 'Status', render: status }, { name: 'amount', title: 'Sum', align: 'right' }]}
  rowConfig={{ highlightOnClick: true, highlightColor: 'var(--atmr-accent-100)', backgroundColor: (row) => (row.status === 'lost' ? 'var(--atmr-bg-surface4)' : ''), onClick: (id) => open(id) }} />
```

## Example 3 - expandable rows, title bar, extra bar

```svelte
{#snippet orders(row: Client)}
  <TableGrid id="orders" less nestedOffset={1} columns={orderColumns} rows={row.orders} />   <!-- nested table: own unique id -->
{/snippet}
{#snippet toolbar()}<Button label="Add" />{/snippet}

<TableGrid id="clients" columns={columns} rows={clients}
  rowConfig={{ expand: { hasExpanded: (row) => !!row.orders?.length, render: orders, expandedKeys: [1] } }}
  renders={{ extraHeader: () => ({ title: 'Clients', content: toolbar }), extraBar: 'Only active' }} />
```

## Filters

Switch the header filters on with `columnConfig={{ filter: true }}` and describe every filter in `column.filter`. The table only shows the state you give it
(`value`) and reports changes (`onFilter`); **you** filter `rows`.

| `column.filter` field | |
|---|---|
| `type` | `'select'` (ui-kit `Select` with autocomplete over `options`) · `'operators'` (text `Input` + operator menu: equal / starts with / contains / ends with) |
| `position` | `'popover'` (default: a filter button in the header opens a popover) · `'inline'` (the filter sits in the header under the title) |
| `options` | `[{ key, value }]` for `type: 'select'` (any DropdownMenu item field such as `hint` / `disabled` is passed on) |
| `value` | current value (controlled; the icon of the filter button is filled while a value is set) |
| `onFilter` | `type: 'select'` - `(value) => void`; `type: 'operators'` - `(value, operator) => void`, `operator` = `'equal' \| 'start' \| 'middle' \| 'end'`, called on Enter / clear |
| `render` | own filter markup (snippet / string) instead of `type`; it is shown in the popover / inline place |

```svelte
<script lang="ts">
  import { TableGrid, type TableGridColumn } from '$lib/components/TableGrid';
  let vls = $state('');
  let ur = $state('');
  const visible = $derived(all.filter((row) => (!vls || row.vls.includes(vls)) && (!ur || row.ur === ur)));
  const columns: TableGridColumn[] = $derived([
    { name: 'vls', title: 'VLS', filter: { type: 'operators', position: 'inline', value: vls, onFilter: (value) => (vls = value) } },
    { name: 'ur', title: 'Type', filter: { type: 'select', options: [{ key: 'org', value: 'Organisation' }], value: ur, onFilter: (value) => (ur = value) } },   // popover
    { name: 'note', title: 'Custom', filter: { position: 'inline', render: noteFilter } }
  ]);
</script>
{#snippet noteFilter()}<Typography variant="body-m">Any markup</Typography>{/snippet}

<TableGrid columnConfig={{ filter: true, resize: true }} {columns} rows={visible} />
```

Only one popover filter is open at a time; it closes on an outside click. An empty result shows `renders.emptyTable` (see the Pagination example).

## Sticky header / footer / first column

`headerSticky` (header row), `footerSticky` (footer area; it is also sticky while the action bar is shown), `addonSticky` (first, service column with checkbox / expand button), `extraHeaderSticky`
(`renders.extraHeader`), `extraBarSticky` (`renders.extraBar`). Sticky parts stick inside the scrolling `.atmr-tablegrid__layout`, so the table needs a
limited size: `containerStyle={{ width: 1000, maxHeight: 500 }}` (or a height-limited parent). The offsets of stacked sticky bars are computed for you;
sticky parts do not cover overlays (modals, popovers, menus).

```svelte
<TableGrid {columns} {rows} headerSticky footerSticky addonSticky extraHeaderSticky extraBarSticky containerStyle={{ width: 1000, maxHeight: 500 }}
  renders={{ extraHeader: () => ({ title: 'Clients' }), extraBar: 'Filters here', footer }} />
```

## Pagination

Paging is not part of the table: cut the page yourself and put the ui-kit `Pagination` into `renders.footer` (add `footerSticky` to keep it visible).

```svelte
<script lang="ts">
  import { TableGrid } from '$lib/components/TableGrid';
  import Pagination from '$lib/components/Pagination/Pagination.svelte';
  let page = $state(1);
  let pageSize = $state(10);
  const from = $derived((page - 1) * pageSize);
  const pageRows = $derived(all.slice(from, from + pageSize));
</script>

{#snippet footer()}
  <Pagination type="buttons" alignment="left" count={all.length} {pageSize} {page} onPageChange={(p) => (page = p)}
    onPageSizeChange={(size) => { pageSize = size; page = 1; }}
    total={{ enabled: true, label: `Rows ${from + 1}-${Math.min(from + pageSize, all.length)} of ${all.length}` }}
    pageSizeChanger={{ enabled: true, pageSizeOptions: [10, 20, 50] }} jumper={{ enabled: true, labelSuffix: `of ${Math.ceil(all.length / pageSize)}` }} />
{/snippet}
{#snippet emptyTable()}<div style="padding: 24px; text-align: center">Nothing found</div>{/snippet}

<TableGrid {columns} rows={pageRows} footerSticky renders={{ footer, emptyTable: all.length === 0 ? emptyTable : undefined }} />
```

## Expandable rows and nested tables

`rowConfig.expand = { hasExpanded(row), render, expandedKeys }`: rows for which `hasExpanded(row)` is true get an expand button; `render` (a snippet
taking the row) is the content of the expanded row - usually a nested `TableGrid` with `less`, `nestedOffset` (1, 2 ..) and its **own `id`**; `hide={{ header: true }}`
hides the header of a nested table. `expandedKeys` = rows that are expanded initially. Any number of levels works; `selection` and `expand` work on every level.

```svelte
{#snippet nested(row: Client)}
  <div style="width: 100%">
    <TableGrid id="orders" less nestedOffset={1} columns={orderColumns} rows={row.orders} rowConfig={{ expand: { hasExpanded: (o) => !!o.items?.length, render: items } }} />
  </div>
{/snippet}

<TableGrid id="clients" {columns} {rows} rowConfig={{ expand: { hasExpanded: (row) => !!row.orders?.length, render: nested, expandedKeys: ['1'] } }} />
```

Custom expanded content works the same way (`render` may return any markup). Selection that cascades through the levels (a checked parent checks its children,
a partly checked parent is indeterminate) is built with `selection.getRowCheckboxState(row)` + `onSelectionChange` per level - see the story `TableGrid/ExpandableTable`.

## Action bars

`renders.actionBar` is the panel above the footer. The table renders it only while at least one row is selected (so selection must be switched on with
`rowConfig.selection`) and keeps the footer area sticky while it is shown.

* `ActionBar` - ready-made "N selected" + delete / cancel buttons; renders nothing while no row is selected. Props: `selectedLabel(count)`, `deleteLabel`, `cancelLabel`,
  `onDelete(keys)`, `onCancel(keys)` (both are followed by clearing the selection), `hideDelete`, `hideCancel`, `children` (extra content between the count and the buttons), `class`.
* your own bar - any markup in the slot; use the same classes (`atmr-tablegrid__actionbar`, `__selection`, `__count`) for the look and `useSelection()` inside the table for the state
  (see the story `TableGrid/ActionBar` -> CustomActionBar).

```svelte
<script lang="ts">
  import { TableGrid, ActionBar } from '$lib/components/TableGrid';
  let selected = $state<string[]>(['2']);
</script>

{#snippet actionBar()}
  <ActionBar deleteLabel="Remove" onDelete={(keys) => remove(keys)}>
    <Button variant="secondary" label="Export" />
  </ActionBar>
{/snippet}

<TableGrid {columns} {rows} rowConfig={{ selection: { defaultSelected: selected, onSelectionChange: (keys) => (selected = keys) } }} renders={{ actionBar }} />
```

`useSelection()` (call it in a component rendered inside the table, e.g. the content of `renders.actionBar`) returns `{ selectedRows, isRowSelected(key), toggleSelectRow, setRowSelected, clearSelection, selectAll }` (`isRowSelected` is O(1), `selectedRows.includes` is not).

## Infinite scroll

`infiniteScroll={{ loadMore: true, loading, onLoadMore }}` - `onLoadMore` fires when the last row becomes visible (the table must scroll: `containerStyle` height or a
height-limited parent); with `action` the user clicks your "load more" block instead.

## Производительность

Таблица на 1000 строк × 8 колонок — это около 19 000 DOM-элементов. **DOM и CSS таблицы идентичны React-оригиналу**, поэтому основную цену платит браузер, а не Svelte:
пересчёт стилей + раскладка одной CSS-сетки на 1000 строк — около 1,5 с на тестовой машине (Ryzen 7 2700, Chromium 120), причём столько же уходит, если вставить тот же DOM через `innerHTML`
без единой строки JS. Код таблицы добавляет к этому ≈ 1 мс на строку (было ≈ 1,4 мс). Кроме первого рендера, **любое изменение, затрагивающее сетку** (сортировка, «выбрать всё», раскрытие строки, добавление строк
бесконечной прокруткой), заново пересчитывает стили / раскладку всей сетки: 0,5–1,9 с на 1000 строк. Подробности, профили и числа — `tools/bench/results/table-perf-notes.md`.
Практика для больших таблиц:

* **Большие списки (от ~300 строк) — `virtual`.** В DOM остаются только видимые строки (+ `overscanCount`, по умолчанию 4): 10 000 строк — первый рендер ≈ 0,2 с (1000 строк — 0,1 с), прокрутка 60 кадров/с, ~30 строк в DOM, 8 МБ памяти
  (без `virtual`: 22 с, 7 кадров/с, 520 МБ); сортировка / выбор / раскрытие — десятки миллисекунд. Второй вариант — постраничность (`Pagination` в `renders.footer`, страница 20–100 строк, пример выше).
  Не рендерите 1000+ строк «просто списком».
* **Строки — `$state.raw`** (или обычный массив / `$derived`), не `$state([...])`: глубокий `$state` оборачивает каждую строку и каждое поле в прокси (память ×2, каждое чтение — через прокси).
  Сортируйте / фильтруйте `$derived`-ом и отдавайте массив с теми же объектами строк: строка, у которой объект не изменился, не перерисовывается (переставляются только DOM-узлы).
* **Стабильные ключи.** `id` (или `rowConfig.key`) уникален и не меняется между обновлениями: по нему строки сопоставляются при сортировке (узлы переставляются, а не создаются заново), по нему же хранятся выбор, раскрытие и подсветка.
  Индекс в массиве как `id` — плохой ключ.
* **Ячейка без `render` — самая дешёвая** (`row[key]`: никаких компонентов, стили / классы колонки считаются один раз на колонку, а не на ячейку). `render`-сниппет — это отдельные реактивные узлы на каждую строку:
  используйте его только в колонках, где он нужен (статус, действия), остальные оставьте данными; не вкладывайте таблицы / формы в каждую ячейку.
* **Не пересоздавайте `columns` / `rowConfig` / `renders` без причины**: `rowConfig={{ ... }}` прямо в разметке — новый объект на каждое обновление родителя, таблица пересчитывает состояния строк
  (неизменившиеся переиспользует, но пересчёт идёт по всему списку). Для больших списков вынесите конфиг в `const` / `$derived`.
* **Выбор и раскрытие** — массивы ключей (`defaultSelected`, `expandedKeys`); внутри таблицы поиск по ним O(1) (`Set`), в своём коде используйте `useSelection().isRowSelected(key)`, а не `selectedRows.includes`.
  «Выбрать всё» на 10 000 строк — один `rows.map((r) => String(r.id))`, а не цикл по `toggleSelectRow`.

### `virtual`

```svelte
<TableGrid {columns} {rows} headerSticky containerStyle={{ maxHeight: 600 }} virtual={{ isEnable: true, overscanCount: 4 }} rowConfig={...} />
```

Виртуальная таблица — **та же CSS-сетка**, что и обычная: шапка, колонка чекбоксов, sticky-шапка / подвал / первая колонка, ресайз и перенос колонок, выбор, раскрытие (в том числе вложенные таблицы), сортировка, фильтры,
бесконечная прокрутка работают как без `virtual`. Окно строк рисуется внутрь сетки через CSS subgrid, высота пропущенных строк заменена отступами, высоты строк (в том числе раскрытых) измеряются.
Устройство и причины — в шапке `modules/virtual/_VirtualRows.svelte`; демо: маршрут `/examples/table-perf` (10 000 / 100 000 строк, счётчик кадров), бенчмарк: `tools/bench` (сценарий S3, `?rows=10000&mode=virtual`).

Ограничения (точно):

* **Нужна ограниченная высота таблицы**: `containerStyle={{ maxHeight: 600 }}` — прокручивается сама таблица (`.atmr-tablegrid__layout`), sticky-шапка / подвал работают. Без `containerStyle` таблица ищет при монтировании
  ближайшего прокручиваемого родителя (`overflow: auto | scroll` и ограниченная высота), иначе прокручивается страница; sticky-шапка в этих режимах, как и у обычной таблицы без высоты, не «прилипает».
  `maxHeight` предпочтительнее `height`: при фиксированной высоте браузер сжимает `auto`-строки сетки до минимального размера (шапка 40 px вместо 57 px у колонок с единицами измерения).
  Режим выбирается один раз при монтировании.
* **Нужен CSS subgrid**: Chrome / Edge 117+, Safari 16+, Firefox 71+.
* **Ширины колонок задавайте явно** (`size: { width }`): `auto`-колонка получает ширину по отрисованным строкам, поэтому «прыгает» при прокрутке.
* **Не в DOM — значит не найдётся**: поиск браузера (Ctrl+F), Tab / фокус и скринридер видят только отрисованные строки; строка с фокусом, ушедшая из окна, теряет фокус.
  Клавиши прокрутки (PageUp / PageDown / Home / End, колесо) работают как у любого контейнера; API «прокрутить к строке» пока нет.
* Класс `atmr-tablegrid__cell--column-hover` (подсветка колонки при наведении на заголовок) получают только уже отрисованные строки.
* Предел — около 818 000 строк по 41 px: максимальная высота прокручиваемого содержимого в Chrome 2²⁵ px (проверено на 1 000 000 строк: дальше 818 400-й строки не долистать); для большего — постраничность на стороне данных. `overscanCount` читается при монтировании.
* `virtual` не действует на `Tree` (у него свой список, `virtualScroll`). Во вложенных таблицах внутри раскрытых строк его включать не рекомендуется (не проверялось: они лежат в прокручиваемом родителе).
* Без `virtual` CSS сетки (взятый из React) рассчитан на ≲ 900 строк: подвал стоит на `grid-row-start: 1000`, пустое состояние — на 900, поэтому в таблице длиннее подвал рисуется **поверх строк**
  (проверено: 1500 строк — подвал накрывает строки около 908-й). В `virtual` этого нет (подвал после окна строк). Длинные таблицы делайте `virtual` / постраничными.

## Анимации (вне оригинала)

> **Авторское расширение — вне оригинала** (`src/lib/ext/tableMotion.svelte.ts`, общий README: `src/lib/ext/README.md`). **Выключено по умолчанию:** без пропа `motion` и без `ExtMotionProvider` DOM, классы и пиксели
> таблицы — как в оригинале (`python tools/compare.py --match "^tablegrid"` и `python tools/ext-check-table.py`: сериализованный DOM после каждого шага равен DOM без расширения). После конца анимации DOM включённой
> таблицы тоже равен DOM выключенной: ни классов, ни атрибутов, ни оставшихся inline-стилей.

```svelte
<ExtMotionProvider mode="svelte"><TableGrid {columns} {rows} /></ExtMotionProvider>      <!-- через провайдер (kind `table-rows`) -->
<TableGrid {columns} {rows} motion />                                                    <!-- или пропом -->
<TableGrid {columns} {rows} motion={{ duration: 250, expand: false, maxRows: 500 }} />    <!-- с опциями -->
```

`motion`: `undefined` (по умолчанию) — как у `ExtMotionProvider` (`overrides['table-rows']` → `mode`, без провайдера выключено) · `false` · `true` · `'tween'` / `'spring'` · объект: `duration` / `easing` / `delay` / `stiffness` / `damping` и переключатели
`rows`, `expand`, `actionBar`, `icons`, `highlight`, `hover` (по умолчанию `true`), `maxRows` (300), `maxExpandRows` (80). Вложенная таблица берёт `motion` внешней.

| что | как |
|---|---|
| **Строки** при сортировке, фильтре, смене страницы, добавлении / удалении | Строки — `display: contents` (у них нет рамки, `animate:flip` неприменим), поэтому расширение мерит ячейку каждой строки до обновления DOM (`$effect.pre`) и после него (`$effect`) и двигает **ячейки**: FLIP для строк, которые остались (`translate`, `'m'`), проявление для новых (opacity + сдвиг 8 px), угасание для ушедших (`out:` Svelte держит строку в DOM `'xs'`, её ячейки закреплены на старых местах — сетка закрывается сразу, строки ниже и подвал едут в освободившееся место). Ключи и порядок — те же, что у `{#each}` таблицы (`row.id` / `rowConfig.key`); строка, вернувшаяся, пока гасла, продолжает с текущей прозрачностью. Узлы DOM те же, двигается только `translate` — выбор, фокус и клавиатура не затронуты. Строки вне видимой области не анимируются |
| **Раскрытие строки**, **панель действий** | `transition:tableSlide` (Svelte `slide` + fade, `'m'`, обратимо посреди хода) на контейнере содержимого / панели; липкие шапка и подвал не прыгают |
| **Стрелка сортировки**, **шеврон** | стрелка ↑ ↔ ↓ переворачивается, ⇅ ↔ стрелка перетекают (старый значок гаснет копией), шеврон › ↔ ⌄ поворачивается (через `transform`: на `<svg>` отдельные `rotate` / `scale` не идут на композиторе) |
| **Цвет строки** | смена `--background-row` (клик при `highlightOnClick`, `rowConfig.backgroundColor(row)`, например подсветка выбранных) плавно перетекает из старого цвета в новый |
| **Наведение / нажатие** | фон строки мягко проявляется и гаснет (в оригинале — мгновенно), кнопки-иконки (сортировка, шеврон, фильтр) «проседают» при нажатии |

Все движения — Web Animations (`translate` / `opacity` / `transform`), как у самих `transition:` / `animate:` Svelte: без покадрового JS (покадровый inline-стиль на ячейках таблицы стоит ≈ 80 мкс на ячейку). Кривые и длительности — токены темы
(`--atmr-motion-*`); `type: 'spring'` берёт для FLIP и появления пружину (небольшой «перелёт»).

Ограничения (точно):

* **`virtual`** и **`prefers-reduced-motion: reduce`** — анимаций нет вообще (в `virtual` окно строк меняется на каждом шаге прокрутки; при `reduce` даже `motion={true}` ничего не включает).
* Строк больше `maxRows` (300) — строки и панель действий без анимации; больше `maxExpandRows` (80) — раскрытие без анимации: высота содержимого меняется на каждом кадре, вся CSS-сетка перекладывается и строки ниже
  перерисовываются (замерено: до 60 строк ≈ 16 мс на кадр, от ≈ 100 строк — 33 мс; 200 строк при `maxExpandRows: 300` — кадры по 50 мс).
* Не анимируются перенос и ресайз колонок, бесконечная прокрутка (новые строки только проявляются), `Tree`.
* Каждая анимируемая ячейка на время анимации — отдельный композитный слой (12 видимых строк ≈ 110 слоёв), поэтому первый кадр после действия немного дольше (таблица: `python tools/ext-check-table.py --perf`).

Стоимость (конец первого кадра после действия, выкл → вкл, медиана 5 запусков на общей машине, Chromium 120): 30 строк — сортировка 63 → 84 мс, фильтр 19 → 56, раскрыть все (10) 45 → 60, «выбрать 3» (панель) 17 → 22; 200 строк — сортировка 382 → 421,
фильтр 100 → 153, «выбрать 3» 33 → 49 (раскрытие при 200 строках по умолчанию мгновенно, см. `maxExpandRows`); кадров дольше 20 мс нет (кроме 2 у фильтра при 200 строках). Выключенный режим — как до расширения: 1000 строк (`tools/bench`, S3 `all`) первый рендер 2 233–2 242 мс против 2 234–2 253 мс, JS 883–886 против 880–888 мс, сортировка 1 797–1 798 против 1 804–1 806 мс;
бандл S3 больше на ≈ 18 КБ (≈ 6 КБ gzip).

Демо: маршрут `/ext/table` (переключатель «без провайдера / выкл / Tween / Spring», 30 / 200 строк, сортировка, фильтр, страницы, выбор, раскрытие, добавление); проверка: `python tools/ext-check-table.py` (оба режима: DOM, геометрия, запуск анимации, конец анимации).

## Notes / deviations from React

* The 24px expand chevrons are used only when the `size` prop is explicitly `'m'` (React quirk, kept).
* After a re-render that replaces the element under a stationary pointer (e.g. the sort icon), the column hover highlight is dropped like in React (listeners are re-attached after the next frame).
* Expanded / selected keys are compared as strings (numeric ids work; React silently ignored numeric `expandedKeys`).
* Rows with a duplicate id are all rendered (React only warns).
* The closed menus / popovers of the filters carry the same inline `style` / `data-popper-placement` as in React (React creates the Popper instance of a
  closed popup only after a later re-render); this is reproduced on purpose so the DOM is identical, it has no visual effect.
