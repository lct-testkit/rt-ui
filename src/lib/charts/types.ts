/** EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. */
// Public types of the chart module (`@lct-testkit/rt-ui/charts`).
import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { MotionProp } from '../ext/motion.svelte.js';

export type { MotionProp };

/** A property name of the datum or a function `(datum, index) => value`. */
export type Accessor<T, R> = (keyof T & string) | ((d: T, i: number) => R);

/** Values of the x axis: a number, a `Date` (time axis) or a string (categories). */
export type XValue = number | Date | string;

/** Formats a number for a tooltip, a label or an axis. */
export type NumberFormat = (value: number) => string;

/** One series of a wide-format data set (one row of `data` = one x position, every series reads its own field). */
export interface SeriesSpec<T> {
	/** stable id of the series: its colour and its visibility follow it, never its position */
	key: string;
	/** name in the legend and the tooltip (default: the key) */
	label?: string;
	/** value of the series in a row */
	y: Accessor<T, number | null | undefined>;
	/** any CSS colour (default: the next colour of the palette, `--rt-chart-N`) */
	color?: string;
}

/** A line series: `SeriesSpec` + line options. */
export interface LineSeriesSpec<T> extends SeriesSpec<T> {
	/** area wash under this line (overrides `area` of the chart) */
	area?: boolean;
	/** dashed line (plan / forecast) */
	dashed?: boolean;
}

/** What the tooltip shows (also passed to the `tooltipContent` snippet). */
export interface TooltipModel {
	/** index of the x position / category / slice */
	index: number;
	/** heading: the formatted x value / category / slice name */
	title: string;
	rows: TooltipRow[];
}
export interface TooltipRow {
	key: string;
	label: string;
	value: number | null;
	/** formatted value */
	text: string;
	color: string;
	/** the series under the pointer / focus */
	active?: boolean;
	/** share of the total, 0..1 (donut / pie) */
	share?: number;
	/** formatted share */
	shareText?: string;
}

/** Props shared by every chart. */
export interface ChartBaseProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'hidden' | 'color'> {
	/** accessible name of the chart (`aria-label` of the image) — write what the chart shows */
	label?: string;
	/** one more sentence for the visually hidden summary (what the reader should take away) */
	description?: string;
	/** text shown instead of an empty chart */
	emptyText?: string;
	/** locale of the numbers and dates (default `ru-RU`) */
	locale?: string;
	/** custom colours for the series / slices (any CSS colour, index = series order); default: the palette `--rt-chart-1…10` */
	colors?: string[];
	/** [ext] motion: undefined = inherit `ExtMotionProvider` (no provider = off), `false` off, `true` / `'tween'` / `'spring'` / options on */
	animate?: MotionProp;
}

/** Content snippet of the tooltip. */
export type TooltipContent = Snippet<[TooltipModel]>;

/** Item of a `Legend`. */
export interface LegendItem {
	key: string;
	label: string;
	/** CSS colour of the swatch */
	color: string;
	/** the series is switched off (drawn dimmed, `aria-pressed="false"`) */
	hidden?: boolean;
	/** swatch shape: a short line (lines), a bar/area rectangle or a dot (donut, pie) */
	marker?: 'line' | 'rect' | 'dot';
	/** formatted value shown after the label (donut / pie) */
	value?: string;
	/** secondary text after the value (a share, for instance) */
	secondary?: string;
}

/** A tick of an axis: position in px along the axis, the raw value and its label. */
export interface AxisTick {
	value: number | string;
	pos: number;
	label: string;
	/** the label split into lines (category axes of bar charts): drawn instead of `label` */
	lines?: string[];
}

// ─── props of the charts ─────────────────────────────────────────────────────────────────────────────────────────

/** Props of `LineChart`. */
export interface LineChartProps<T = unknown> extends ChartBaseProps {
	/** plain array of objects */
	data: T[];
	/** x of a row: a property name or a function; a number, a `Date` or a string (category) */
	x: Accessor<T, XValue>;
	/** value of a row: a single series, or the value column of long data (with `seriesBy`) */
	y?: Accessor<T, number | null | undefined>;
	/** name of the series when only `y` is given (tooltip, summary; default «Значение») */
	yLabel?: string;
	/** wide data: one series per field (`key` is the identity: its colour and visibility follow it) */
	series?: LineSeriesSpec<T>[];
	/** long data: the property / function that names the series of a row */
	seriesBy?: Accessor<T, string>;
	/** `auto` (default): a `Date` gives a time axis, a number a linear one, a string categories */
	xType?: 'auto' | 'category' | 'number' | 'time';
	/** height of the plot, px (the width follows the container) */
	height?: number;
	/** fixed width, px (default: the width of the container, followed with a ResizeObserver) */
	width?: number;
	/** smooth (monotone) curves instead of straight segments */
	smooth?: boolean;
	/** a soft area under every line (a `series[i].area` overrides it) */
	area?: boolean;
	/** markers on every data point (default: only the ones under the pointer; a single point is always drawn) */
	points?: boolean;
	/** vertical hairline at the hovered / focused x */
	crosshair?: boolean;
	/** tooltip with every series at the hovered / focused x */
	tooltip?: boolean;
	/** replaces the rows of the tooltip */
	tooltipContent?: TooltipContent;
	/** legend: `top` (default with 2+ series), `bottom`, or `false` / `'none'` */
	legend?: boolean | 'top' | 'bottom' | 'none';
	/** horizontal gridlines */
	grid?: boolean;
	/** desired number of y ticks (default: by height) */
	yTicks?: number;
	/** lower / upper end of the y domain (the ticks round them to "nice" values) */
	yMin?: number;
	yMax?: number;
	/** include zero in the y domain (default: only with an area) */
	yZero?: boolean;
	/** label of an x value (axis and tooltip title); the default follows the type of x and `locale` */
	xFormat?: (x: XValue, index: number) => string;
	/** y axis ticks (default: compact, «1,3 млн») */
	tickFormat?: NumberFormat;
	/** values in the tooltip and in the summary (default: grouped number, «1 250 000») */
	valueFormat?: NumberFormat;
	/** keys of the hidden series; bindable (the legend toggles them) */
	hidden?: string[];
	/** a point was clicked / activated with Enter: its index and x */
	onSelect?: (info: { index: number; x: XValue }) => void;
}

/** Props of `BarChart`. */
export interface BarChartProps<T = unknown> extends ChartBaseProps {
	/** plain array of objects */
	data: T[];
	/** category of a row: a property name or a function (its label is the name of the bar / group) */
	x: Accessor<T, XValue>;
	/** value of a row: a single series, or the value column of long data (with `seriesBy`) */
	y?: Accessor<T, number | null | undefined>;
	/** name of the series when only `y` is given (tooltip, summary; default «Значение») */
	yLabel?: string;
	/** wide data: one series per field */
	series?: SeriesSpec<T>[];
	/** long data: the property / function that names the series of a row */
	seriesBy?: Accessor<T, string>;
	/** horizontal bars (categories on the left) */
	horizontal?: boolean;
	/** stack the series instead of grouping them */
	stacked?: boolean;
	/** colour of every bar of a SINGLE series (an ordinal ramp for a funnel, see `chartRamp`); a property name or a function returning any CSS colour */
	color?: Accessor<T, string>;
	/** height of the plot, px */
	height?: number;
	/** fixed width, px (default: the width of the container) */
	width?: number;
	/** thickest a bar may be, px (default 24: bars are thin, the slot leftover stays air) */
	maxBarSize?: number;
	/** gridlines of the value axis */
	grid?: boolean;
	/** the value axis (ticks and labels); switch it off when the bars carry `valueLabels` */
	axis?: boolean;
	/** legend: `top` (default with 2+ series), `bottom`, or `false` / `'none'` */
	legend?: boolean | 'top' | 'bottom' | 'none';
	/** tooltip per category with every series (and the total of a stack) */
	tooltip?: boolean;
	tooltipContent?: TooltipContent;
	/** value labels at the end of the bars (of the stack), drawn only where they fit */
	valueLabels?: boolean;
	/** text of a value label (default: `valueFormat`) */
	valueLabel?: (value: number, info: { index: number; key: string }) => string;
	yTicks?: number;
	yMin?: number;
	yMax?: number;
	/** label of a category (axis, tooltip); default: the value as text (a `Date` as month / date) */
	xFormat?: (x: XValue, index: number) => string;
	/** value axis ticks (default: compact, «1,3 млн») */
	tickFormat?: NumberFormat;
	/** values in the tooltip, labels and summary (default: grouped number) */
	valueFormat?: NumberFormat;
	/** keys of the hidden series; bindable (the legend toggles them) */
	hidden?: string[];
	/** a category was clicked / activated with Enter */
	onSelect?: (info: { index: number; x: XValue }) => void;
}

/** One segment of a donut / pie as the `center` snippet sees it. */
export interface DonutSlice {
	key: string;
	name: string;
	value: number;
	/** share of the visible total, 0..1 */
	share: number;
	color: string;
	index: number;
}
/** What the `center` snippet of a `DonutChart` receives. */
export interface DonutCenter {
	/** sum of the visible segments */
	total: number;
	totalText: string;
	/** the segment under the pointer / focus (`null`: none) */
	active: DonutSlice | null;
}

/** Props of `DonutChart`. */
export interface DonutChartProps<T = unknown> extends ChartBaseProps {
	/** plain array of objects: one row = one segment */
	data: T[];
	/** name of a segment: a property name or a function */
	name: Accessor<T, string>;
	/** size of a segment: a property name or a function (non-positive values are not drawn) */
	value: Accessor<T, number | null | undefined>;
	/** colour of a segment (any CSS colour); default: the palette in the order of the rows */
	color?: Accessor<T, string>;
	/** inner radius as a share of the outer one: 0 = a pie, default 0.62 */
	innerRadius?: number;
	/** diameter of the ring, px */
	size?: number;
	/** gap between the segments, px */
	gap?: number;
	/** angle of the first segment, degrees clockwise from 12 o'clock */
	startAngle?: number;
	/** legend: on the right / below (default), or `false` / `'none'` */
	legend?: boolean | 'none';
	/** tooltip with the name, the value and the share. Default: on for a pie and for a custom `center`, off for a ring with the default centre (the centre already shows the segment under the pointer) */
	tooltip?: boolean;
	tooltipContent?: TooltipContent;
	/** content of the hole: the total by default (nothing for a pie) */
	center?: Snippet<[DonutCenter]>;
	/** caption under the total in the default centre */
	centerLabel?: string;
	/** values in the legend, tooltip and summary */
	valueFormat?: NumberFormat;
	/** keys (= names) of the hidden segments; bindable */
	hidden?: string[];
	/** a segment was clicked / activated with Enter */
	onSelect?: (info: { index: number; name: string; value: number }) => void;
}

/** Props of `PieChart` (a `DonutChart` without a hole). */
export type PieChartProps<T = unknown> = Omit<DonutChartProps<T>, 'innerRadius' | 'center' | 'centerLabel'>;

/** Props of `Sparkline`. */
export interface SparklineProps<T = number> extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'color'> {
	/** the values: numbers, or objects read with `y` */
	data: T[];
	/** value of an object row (property name or function); not needed for plain numbers */
	y?: Accessor<T, number | null | undefined>;
	/** `line` (default), `area` (line + soft wash) or `bar` */
	type?: 'line' | 'area' | 'bar';
	/** fixed width, px (default: fills its container, e.g. a table cell) */
	width?: number;
	/** height, px (default 28) */
	height?: number;
	/** any CSS colour (default: the first colour of the palette) */
	color?: string;
	/** smooth (monotone) curve */
	smooth?: boolean;
	/** marker on the last value (default: on for `line` and `area`) */
	endDot?: boolean;
	/** lower / upper end of the vertical domain (default: the extent of the data) */
	min?: number;
	max?: number;
	/** accessible name: what the trend is (default «Динамика»); the summary of the values follows it */
	label?: string;
	/** locale of the numbers in the summary (default `ru-RU`) */
	locale?: string;
	/** numbers in the summary */
	valueFormat?: NumberFormat;
	/** [ext] motion: undefined = inherit `ExtMotionProvider` (no provider = off), `false` off, `true` / `'tween'` / `'spring'` / options on */
	animate?: MotionProp;
}
