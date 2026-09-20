// Public types of the TableGrid (port of the `IColumn`, `IRows`, `IRowConfig`, `IRenders` ... types of packages/tablegird).
//
//   import type { TableGridColumn, TableGridRow, TableGridProps } from '$lib/components/TableGrid/types';
//
// React -> Svelte differences in the value types:
//   * a "node" (`ReactNode`, `() => ReactNode` render functions without arguments) is `Content` (string | number | Snippet);
//   * a render function that receives the row (`render(rowData)`) is a `Snippet<[row]>`;
//   * `className` is `class`; `style` / `containerStyle` accept a CSS string or a React-like object (`{ maxHeight: 300 }`).
import type { Snippet } from 'svelte';
import type { TableGridMotion } from '../../ext/tableMotion.svelte.js';
import type { Content } from '../../internal/types.js';
import type { StyleValue } from '../../utils/style.js';

export type TableGridSize = 's' | 'm';
export type TableGridVariant = 'primary';
export type TableGridSortVariant = 'asc' | 'desc' | 'default';
export type TableGridFilterType = 'operators' | 'select';
export type TableGridFilterPosition = 'popover' | 'inline';
export type TableGridOperator = 'equal' | 'start' | 'middle' | 'end';
export type TableGridAlign = 'left' | 'right';

/** Row key. Rows are matched by it (selection, expand, highlight), so it must be unique inside the table. */
export type TableGridRowKey = string | number;

/**
 * A row: an object with a unique `id` (or the field named in `rowConfig.key`) and any other fields.
 * A cell shows `row[column.key ?? column.name]`; when that value is an object `{ content }` the `content` is shown
 * (`warning` / `error` flags of such an object mark the cell).
 */
export interface TableGridRow {
	id: TableGridRowKey;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[field: string]: any;
}

/** Размеры колонки. `width`: число (px) или CSS-строка ('200px', '1fr'); `min` / `max` (число) ограничивают ресайз мышью. */
export interface TableGridColumnSize {
	width?: number | string;
	min?: number | string;
	max?: number | string;
}

/** Сортировка колонки: таблица только показывает иконку `sort` и вызывает `onSort()`, сами данные сортирует потребитель. */
export interface TableGridColumnSorting {
	sort?: TableGridSortVariant;
	onSort?: () => void;
}

/** Option of a `select` filter: an item of the ui-kit `DropdownMenu` (`key` + `value`, any other DropdownMenu item field such as `hint` / `disabled` is passed on). */
export interface TableGridFilterOption {
	key: string | number;
	value: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[extra: string]: any;
}

/** Фильтр колонки (включается `columnConfig.filter`). */
export interface TableGridColumnFilter {
	/** `operators` - поле ввода + выбор оператора, `select` - выпадающий список `options` */
	type?: TableGridFilterType;
	/** `popover` (по умолчанию) - кнопка в заголовке, открывающая поповер; `inline` - фильтр прямо в заголовке */
	position?: TableGridFilterPosition;
	/** Варианты для `type: 'select'` */
	options?: TableGridFilterOption[];
	/** Текущее значение (управляемое) */
	value?: string;
	/** Вызывается при изменении значения: `type: 'select'` - `(value)`, `type: 'operators'` - `(value, operator)` */
	onFilter?: (value: string, operator?: TableGridOperator) => void;
	/** Собственная разметка фильтра вместо стандартной */
	render?: Content;
}

/** Колонка таблицы. */
export interface TableGridColumn<T extends TableGridRow = TableGridRow> {
	/** Уникальное название колонки */
	name: string;
	/** Ключ для получения данных из строки, если не указан, то равен name */
	key?: string;
	/** Заголовок колонки */
	title?: Content;
	/** Единица измерения (показывается под заголовком) */
	unit?: Content;
	/** Размер колонки */
	size?: TableGridColumnSize;
	/** Выравнивание заголовка (по умолчанию `left`) */
	align?: TableGridAlign;
	/** Переносить текст заголовка */
	textWrap?: boolean;
	/** Фиксация колонки по правому краю */
	stickyEnd?: boolean;
	/** Собственная разметка ячейки: `{#snippet cell(row)}...{/snippet}` */
	render?: Snippet<[T]>;
	/** Объект значений сортировки (включается `columnConfig.sorting`) */
	sorting?: TableGridColumnSorting;
	/** Фильтр колонки (включается `columnConfig.filter`) */
	filter?: TableGridColumnFilter;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[extra: string]: any;
}

/** Дополнительные возможности колонок. */
export interface TableGridColumnConfig {
	/** Перетаскивание колонок (drag and drop) */
	move?: boolean;
	/** Изменение ширины колонок мышью */
	resize?: boolean;
	/** Кнопки сортировки (нужен `column.sorting`) */
	sorting?: boolean;
	/** Фильтры (нужен `column.filter`) */
	filter?: boolean;
}

export interface TableGridExpandConfig<T extends TableGridRow = TableGridRow> {
	/** Есть ли у строки раскрываемое содержимое */
	hasExpanded?: (row: T) => boolean;
	/** Содержимое раскрытой строки (например, вложенная таблица): `{#snippet expanded(row)}...{/snippet}` */
	render: Snippet<[T]>;
	/** Ключи раскрытых строк (управляемое значение) */
	expandedKeys?: TableGridRowKey[];
}

export interface TableGridCheckboxState {
	checked?: boolean;
	indeterminate?: boolean;
}

export interface TableGridSelectionConfig<T extends TableGridRow = TableGridRow> {
	/** Ключи выбранных строк. Без `onSelectionChange` - начальное значение (таблица хранит выбор сама), с ним - управляемое значение */
	defaultSelected?: TableGridRowKey[];
	/** Вызывается при выборе / снятии выбора строки, аргумент - ключ строки (строкой) */
	onSelect?: (rowKey: string) => void;
	/** Вызывается при любом изменении выбора, аргумент - массив ключей выбранных строк */
	onSelectionChange?: (selected: string[]) => void;
	/** Содержимое шапки первой колонки (обычно общий чекбокс) */
	renderFirstColumnHeader?: Content;
	/** Состояние чекбокса строки (например, для деревьев / частично выбранных строк) */
	getRowCheckboxState?: (row: T) => TableGridCheckboxState | null | undefined;
}

export type TableGridRowStyleValue<T> = string | ((row: T) => string | null | undefined);

export interface TableGridRowConfig<T extends TableGridRow = TableGridRow> {
	/** Название поля строки с уникальным ключом (по умолчанию `id`) */
	key?: string;
	/** Клик по строке, аргумент - ключ строки */
	onClick?: (id: TableGridRowKey) => void;
	/** Двойной клик по строке, аргумент - ключ строки */
	onDoubleClick?: (id: TableGridRowKey) => void;
	/** Включает подсветку строки при клике */
	highlightOnClick?: boolean;
	/** Цвет подсветки: строка с цветом или функция `(row) => цвет` */
	highlightColor?: TableGridRowStyleValue<T>;
	/** Цвет фона строки: строка с цветом или функция `(row) => цвет` */
	backgroundColor?: TableGridRowStyleValue<T>;
	/** Нижняя граница строки (значение CSS `border-bottom`) или функция `(row) => значение` */
	borderBottom?: TableGridRowStyleValue<T>;
	/** Раскрываемые строки */
	expand?: TableGridExpandConfig<T>;
	/** Выбор строк (чекбоксы) */
	selection?: TableGridSelectionConfig<T>;
}

export interface TableGridHeaderBarProps {
	/** Заголовок таблицы */
	title?: Content;
	/** Любое содержимое справа от заголовка */
	content?: Content;
}

/** Дополнительные слоты. Каждый - строка / число / snippet. */
export interface TableGridRenders {
	/** Слот в футере таблицы */
	footer?: Content;
	/** Слот для панели действий над футером (показывается, когда выбрана хотя бы одна строка) */
	actionBar?: Content;
	/** Слот между заголовком и таблицей */
	extraBar?: Content;
	/** Слот для заголовка таблицы: объект `{ title, content }` или функция, которая его возвращает */
	extraHeader?: TableGridHeaderBarProps | (() => TableGridHeaderBarProps);
	/** Кастомная разметка для пустой таблицы */
	emptyTable?: Content;
}

export interface TableGridInfiniteScroll {
	/** Есть ли ещё страницы для подгрузки */
	loadMore?: boolean;
	/** Включает состояние загрузки таблицы */
	loading?: boolean;
	/** Вызывается при прокрутке до последней строки */
	onLoadMore?: () => void;
	/** Кнопка / блок "загрузить ещё" вместо автоподгрузки: `{#snippet action(loadMore)}...{/snippet}` */
	action?: Snippet<[() => void]>;
	/** Собственный индикатор загрузки */
	loader?: Content;
}

export interface TableGridVirtual {
	/** Включает виртуальный список строк: в DOM только видимые строки (нужна высота таблицы: `containerStyle={{ maxHeight }}`, см. README «Производительность») */
	isEnable?: boolean;
	/** Сколько строк дорисовывать за границами видимой области (по умолчанию 4) */
	overscanCount?: number;
}

export interface TableGridHide {
	/** Скрывает строку заголовков */
	header?: boolean;
}

export interface TableGridProps<T extends TableGridRow = TableGridRow> {
	/** Описывает массив колонок */
	columns: TableGridColumn<T>[];
	/** Описывает массив строк */
	rows: T[];
	/** Задаёт ID таблицы, обязательный параметр при использовании вложенных таблиц. Должен быть уникальным */
	id?: string;
	/** Задаёт размер таблицы */
	size?: TableGridSize;
	/** Задаёт вариант для компонента */
	variant?: TableGridVariant;
	/** Задаёт дополнительные возможности колонок (перетаскивание, ресайз, сортировка, фильтр) */
	columnConfig?: TableGridColumnConfig;
	/** Задаёт параметры для строк */
	rowConfig?: TableGridRowConfig<T>;
	/** Задаёт дополнительные слоты */
	renders?: TableGridRenders;
	/** Задаёт параметры для infiniteScroll */
	infiniteScroll?: TableGridInfiniteScroll;
	/** Задаёт сокрытие элементов */
	hide?: TableGridHide;
	/** Отключает базовые стили (рамку) таблицы */
	less?: boolean;
	/** Задаёт отступ для первой колонки, принимает 1, 2, 4 и тд, используется вместе с вложенными таблицами */
	nestedOffset?: number;
	/** Фиксация первой колонки по левому краю */
	addonSticky?: boolean;
	/** Фиксация строки заголовков колонок */
	headerSticky?: boolean;
	/**
	 * [ext, not in original] Выравнивать содержимое ячеек тела по `column.align`. В оригинале `align` действует только на заголовок колонки,
	 * ячейки тела его игнорируют. По умолчанию выключено — DOM идентичен оригиналу.
	 */
	alignCells?: boolean;
	/** Фиксация футера */
	footerSticky?: boolean;
	/** Фиксация панели extraHeader */
	extraHeaderSticky?: boolean;
	/** Фиксация панели extraBar */
	extraBarSticky?: boolean;
	/** Стили корневого элемента */
	style?: StyleValue;
	/** Стили для контейнера таблицы, позволяет изменять размеры и добавлять скролл */
	containerStyle?: StyleValue;
	/** Дополнительные классы корневого элемента */
	class?: string;
	/** Callback-функция, вызываемая при изменении ширины колонок */
	onCollsResize?: (colId: string, width: number) => void;
	/** Callback-функция, вызываемая при перемещении колонок */
	onCollsSwap?: (colA: string, colB: string) => void;
	/** Виртуальный список строк (см. modules/virtual и README «Производительность») */
	virtual?: TableGridVirtual;
	/**
	 * [ext, not in original] Анимации таблицы (вне оригинала): FLIP строк при сортировке / фильтре / смене страницы, появление и уход строк, раскрытие строки,
	 * панель действий, стрелка сортировки, плавная смена цвета строки, hover. `undefined` (по умолчанию) наследует `ExtMotionProvider` (без провайдера — выключено),
	 * `false` — выключено, `true` / `'tween'` / `'spring'` / `{ duration, easing, rows, expand, actionBar, icons, highlight, hover, maxRows }` — включено.
	 * Выключено (по умолчанию) — DOM, классы и пиксели как в оригинале. Не работает в `virtual` и при `prefers-reduced-motion: reduce`. См. README «Анимации (вне оригинала)».
	 */
	motion?: TableGridMotion;
	/** `tree` - режим для компонента Tree (плоский список без раскрывающихся контейнеров) */
	component?: 'tree';
	/** Смещать раскрытое содержимое на ширину первой (служебной) колонки (по умолчанию `true`) */
	offsetEnable?: boolean;
	/** Не используется (есть в React-типах) */
	width?: string | number;
	/** Не используется (есть в React-типах) */
	height?: string | number;
}
