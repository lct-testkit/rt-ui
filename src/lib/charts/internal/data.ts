/** EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. */
// Turns "plain arrays of objects + accessors" into the numbers the charts draw.
//
//   wide format   one row = one x position, every `series[i].y` reads its own field:  { month, revenue, plan }
//   long format   one row = one point, `seriesBy` names its series:                    { month, region, revenue }
import { chartColor } from './palette.js';
import { createLongDateFormat, createNumberFormat } from './format.js';
import type { Accessor, LineSeriesSpec, XValue } from '../types.js';

export type XKind = 'category' | 'number' | 'time';

/** Property name or function -> function. */
export function getter<T, R>(a: Accessor<T, R>): (d: T, i: number) => R;
export function getter<T, R>(a: Accessor<T, R> | undefined): ((d: T, i: number) => R) | undefined;
export function getter<T, R>(a: Accessor<T, R> | undefined): ((d: T, i: number) => R) | undefined {
	if (a === undefined || a === null) return undefined;
	if (typeof a === 'function') return a;
	return (d: T) => (d as Record<string, unknown>)[a] as R;
}

/** finite number or null */
export function toNum(v: unknown): number | null {
	if (v === null || v === undefined || v === '') return null;
	const n = typeof v === 'number' ? v : v instanceof Date ? v.getTime() : Number(v);
	return Number.isFinite(n) ? n : null;
}

export interface RawSeries {
	key: string;
	label: string;
	/** every position of the x axis (null = no value) */
	values: (number | null)[];
	/** the colour of the entity: its own `color`, the chart's `colors[index]` or the palette slot of its index */
	color: string;
	/** index among ALL series (visible or not): the colour follows the entity, never its rank */
	index: number;
	area?: boolean;
	dashed?: boolean;
}

export interface XYData {
	kind: XKind;
	/** raw x per position */
	raw: XValue[];
	/** numeric x per position: category -> position index, number -> the number, time -> ms */
	num: number[];
	series: RawSeries[];
}

export interface XYOptions<T> {
	data: T[];
	x: Accessor<T, XValue>;
	series?: LineSeriesSpec<T>[];
	y?: Accessor<T, number | null | undefined>;
	seriesBy?: Accessor<T, string>;
	xType?: 'auto' | XKind;
	colors?: string[];
	/** name of the only series when neither `series` nor `seriesBy` is given */
	singleLabel?: string;
}

const colorOf = (i: number, own: string | undefined, colors: string[] | undefined) => own ?? colors?.[i] ?? chartColor(i);

function detectKind(raw: XValue[], xType: XYOptions<unknown>['xType']): XKind {
	if (xType && xType !== 'auto') return xType;
	const first = raw.find((v) => v !== null && v !== undefined);
	if (first instanceof Date) return 'time';
	if (typeof first === 'number') return 'number';
	return 'category';
}

/** wide or long format -> positions × series */
export function buildXY<T>(o: XYOptions<T>): XYData {
	const xf = getter(o.x);
	const rawAll = o.data.map((d, i) => xf(d, i));
	const kind = detectKind(rawAll, o.xType);
	const keyOf = (v: XValue, i: number): string | number => (kind === 'category' ? String(v) : kind === 'time' ? (toNum(v) ?? i) : (toNum(v) ?? i));

	let raw: XValue[] = [];
	let series: RawSeries[] = [];

	if (o.seriesBy) {
		// long format: group rows by series, align by x
		const sb = getter(o.seriesBy);
		const yf = getter(o.y ?? ((() => null) as (d: T) => number | null));
		const posOf = new Map<string | number, number>();
		const values = new Map<string, (number | null)[]>();
		const order: string[] = [];
		o.data.forEach((d, i) => {
			const xk = keyOf(rawAll[i], i);
			let p = posOf.get(xk);
			if (p === undefined) {
				p = raw.length;
				posOf.set(xk, p);
				raw.push(rawAll[i]);
			}
			const sk = String(sb(d, i));
			if (!values.has(sk)) {
				values.set(sk, []);
				order.push(sk);
			}
			values.get(sk)![p] = toNum(yf(d, i));
		});
		series = order.map((k, index) => ({
			key: k,
			label: k,
			index,
			color: colorOf(index, undefined, o.colors),
			values: Array.from({ length: raw.length }, (_, p) => values.get(k)![p] ?? null)
		}));
	} else if (o.series?.length) {
		raw = rawAll;
		series = o.series.map((s, index) => {
			const yf = getter(s.y);
			return {
				key: s.key,
				label: s.label ?? s.key,
				index,
				color: colorOf(index, s.color, o.colors),
				area: s.area,
				dashed: s.dashed,
				values: o.data.map((d, i) => toNum(yf(d, i)))
			};
		});
	} else {
		raw = rawAll;
		const yf = getter(o.y ?? ((() => null) as (d: T) => number | null));
		series = [
			{ key: 'value', label: o.singleLabel ?? 'Значение', index: 0, color: colorOf(0, undefined, o.colors), values: o.data.map((d, i) => toNum(yf(d, i))) }
		];
	}

	let num = raw.map((v, i) => (kind === 'category' ? i : (toNum(v) ?? i)));
	if (kind !== 'category' && num.length > 1) {
		// numbers / dates: ascending x, whatever the order of the rows
		const order = num.map((_, i) => i).sort((a, b) => num[a] - num[b] || a - b);
		if (order.some((v, i) => v !== i)) {
			num = order.map((i) => num[i]);
			raw = order.map((i) => raw[i]);
			series = series.map((s) => ({ ...s, values: order.map((i) => s.values[i]) }));
		}
	}
	return { kind, raw, num, series };
}

/** `[min, max]` of the finite numbers (or `null` when there are none) */
export function extent(values: Iterable<number | null | undefined>): [number, number] | null {
	let lo = Infinity;
	let hi = -Infinity;
	for (const v of values) {
		if (v === null || v === undefined || !Number.isFinite(v)) continue;
		if (v < lo) lo = v;
		if (v > hi) hi = v;
	}
	return lo <= hi ? [lo, hi] : null;
}

/** Label of an x value for tooltips, aria and category axes. */
export function xLabelOf(v: XValue, kind: XKind, locale: string, allDates?: Date[], short = false): string {
	if (v instanceof Date) {
		if (short) {
			// axis labels: "июл." for monthly data, "5 сент." otherwise
			const monthly = (allDates ?? [v]).every((d) => d.getDate() === 1);
			return new Intl.DateTimeFormat(locale, monthly ? { month: 'short' } : { day: 'numeric', month: 'short' }).format(v);
		}
		// monthly data (every date is the 1st): month and year; otherwise the long date
		const monthly = (allDates ?? [v]).every((d) => d.getDate() === 1);
		// "июль 2026 г." -> "Июль 2026", "18 сентября 2026 г." -> "18 сентября 2026"
		const text = (monthly ? new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(v) : createLongDateFormat(locale)(v)).replace(/\s*г\.$/, '');
		return monthly ? text.charAt(0).toLocaleUpperCase(locale) + text.slice(1) : text;
	}
	if (typeof v === 'number') return kind === 'category' ? String(v) : createNumberFormat(locale)(v);
	return String(v ?? '');
}
