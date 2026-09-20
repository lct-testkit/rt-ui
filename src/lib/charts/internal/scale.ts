/** EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. */
// Scales and "nice" ticks for the chart module (zero dependencies). Everything here is pure and SSR-safe.

export type Domain = [number, number];

export interface LinearScale {
	(value: number): number;
	readonly domain: Domain;
	readonly range: [number, number];
	/** pixel -> value */
	invert(px: number): number;
}

/** Linear scale; a zero-width domain maps everything to the middle of the range. */
export function linearScale(domain: Domain, range: [number, number]): LinearScale {
	const [d0, d1] = domain;
	const [r0, r1] = range;
	const k = d1 === d0 ? 0 : (r1 - r0) / (d1 - d0);
	const mid = (r0 + r1) / 2;
	const fn = ((v: number) => (d1 === d0 ? mid : r0 + (v - d0) * k)) as LinearScale;
	Object.defineProperties(fn, {
		domain: { value: domain },
		range: { value: range },
		invert: { value: (px: number) => (k === 0 ? d0 : d0 + (px - r0) / k) }
	});
	return fn;
}

// ─── nice numbers ────────────────────────────────────────────────────────────────────────────────────────────────

const E10 = Math.sqrt(50);
const E5 = Math.sqrt(10);
const E2 = Math.sqrt(2);

/** A "nice" tick step (1, 2 or 5 times a power of ten) that gives roughly `count` steps over `range`. */
export function niceStep(range: number, count: number): number {
	const raw = range / Math.max(1, count);
	if (!(raw > 0) || !Number.isFinite(raw)) return 1;
	const power = Math.floor(Math.log10(raw));
	const error = raw / Math.pow(10, power);
	const factor = error >= E10 ? 10 : error >= E5 ? 5 : error >= E2 ? 2 : 1;
	return factor * Math.pow(10, power);
}

/** decimals needed to print multiples of a 1/2/5 × 10^k step exactly */
const decimalsOf = (step: number) => Math.max(0, -Math.floor(Math.log10(step)));

export interface NiceTicks {
	/** tick values, ascending, `values[0] === min`, `values[last] === max` of the nice domain */
	values: number[];
	/** the nice domain (covers the input) */
	domain: Domain;
	step: number;
}

/**
 * "Nice" ticks for [min, max]: the domain is widened to multiples of a 1/2/5 step so that the first and the last tick
 * are the domain ends (tidy gridlines). A flat range (min === max) is padded so that something can be drawn.
 * `integer: true` keeps the step at 1 or more (an axis of years / weeks / counts never shows 1,5).
 */
export function niceTicks(min: number, max: number, count = 5, opts: { integer?: boolean } = {}): NiceTicks {
	if (!Number.isFinite(min) || !Number.isFinite(max)) {
		min = 0;
		max = 1;
	}
	if (min > max) [min, max] = [max, min];
	if (min === max) {
		if (min === 0) max = 1;
		else {
			const pad = Math.abs(min) * 0.1;
			min -= pad;
			max += pad;
		}
	}
	let step = niceStep(max - min, count);
	// whole numbers on the axis (years, weeks, counts): never a step below 1
	if (opts.integer && step < 1) step = 1;
	const lo = Math.floor(min / step + 1e-9) * step;
	const hi = Math.ceil(max / step - 1e-9) * step;
	const digits = Math.min(12, decimalsOf(step) + 1);
	const values: number[] = [];
	const n = Math.round((hi - lo) / step);
	for (let i = 0; i <= n; i++) values.push(Number((lo + i * step).toFixed(digits)));
	return { values, domain: [values[0], values[values.length - 1]], step };
}

/**
 * `niceTicks` that also respects the room: when the "nice" widening of the domain gives more ticks than `minGap` px allows over `length` px,
 * the wanted count is lowered (down to one step over the whole domain) until they fit, so the labels of a small chart never overlap.
 */
export function fitTicks(min: number, max: number, length: number, want: number, minGap = 22, opts: { integer?: boolean } = {}): NiceTicks {
	let count = Math.max(1, want);
	let t = niceTicks(min, max, count, opts);
	while (count > 1 && (t.values.length - 1) * minGap > length) t = niceTicks(min, max, --count, opts);
	return t;
}

/** How many ticks fit `length` px with about `gap` px between them (min 2, max 10). */
export function tickCountFor(length: number, gap = 44): number {
	return Math.max(2, Math.min(10, Math.floor(length / gap)));
}

// ─── time ticks ──────────────────────────────────────────────────────────────────────────────────────────────────

const HOUR = 3600_000;
const DAY = 24 * HOUR;

export type TimeUnit = 'hour' | 'day' | 'month' | 'year';
interface TimeStep {
	unit: TimeUnit;
	step: number;
	/** approximate length in ms (used to pick the step) */
	ms: number;
}

const TIME_STEPS: TimeStep[] = [
	{ unit: 'hour', step: 1, ms: HOUR },
	{ unit: 'hour', step: 3, ms: 3 * HOUR },
	{ unit: 'hour', step: 6, ms: 6 * HOUR },
	{ unit: 'hour', step: 12, ms: 12 * HOUR },
	{ unit: 'day', step: 1, ms: DAY },
	{ unit: 'day', step: 2, ms: 2 * DAY },
	{ unit: 'day', step: 7, ms: 7 * DAY },
	{ unit: 'day', step: 14, ms: 14 * DAY },
	{ unit: 'month', step: 1, ms: 30.4 * DAY },
	{ unit: 'month', step: 2, ms: 60.8 * DAY },
	{ unit: 'month', step: 3, ms: 91.3 * DAY },
	{ unit: 'month', step: 6, ms: 182.6 * DAY },
	{ unit: 'year', step: 1, ms: 365.25 * DAY },
	{ unit: 'year', step: 2, ms: 730.5 * DAY },
	{ unit: 'year', step: 5, ms: 1826 * DAY },
	{ unit: 'year', step: 10, ms: 3652 * DAY },
	{ unit: 'year', step: 20, ms: 7305 * DAY },
	{ unit: 'year', step: 50, ms: 18262 * DAY }
];

export interface TimeTicks {
	/** timestamps (ms), ascending, all inside [min, max] */
	values: number[];
	unit: TimeUnit;
	step: number;
}

function firstTick(min: number, unit: TimeUnit, step: number): Date {
	const d = new Date(min);
	if (unit === 'hour') {
		d.setMinutes(0, 0, 0);
		d.setHours(Math.floor(d.getHours() / step) * step);
	} else if (unit === 'day') {
		d.setHours(0, 0, 0, 0);
	} else if (unit === 'month') {
		d.setDate(1);
		d.setHours(0, 0, 0, 0);
		d.setMonth(Math.floor(d.getMonth() / step) * step);
	} else {
		d.setMonth(0, 1);
		d.setHours(0, 0, 0, 0);
		d.setFullYear(Math.floor(d.getFullYear() / step) * step);
	}
	return d;
}

function advance(d: Date, unit: TimeUnit, step: number): void {
	if (unit === 'hour') d.setHours(d.getHours() + step);
	else if (unit === 'day') d.setDate(d.getDate() + step);
	else if (unit === 'month') d.setMonth(d.getMonth() + step);
	else d.setFullYear(d.getFullYear() + step);
}

/** Calendar-aware ticks (hours / days / months / years) for a time domain, at most ~`count` of them. */
export function timeTicks(min: number, max: number, count = 6): TimeTicks {
	const span = Math.max(1, max - min);
	const want = Math.max(2, count);
	let pick = TIME_STEPS[TIME_STEPS.length - 1];
	for (const s of TIME_STEPS) {
		if (span / s.ms <= want) {
			pick = s;
			break;
		}
	}
	const values: number[] = [];
	const d = firstTick(min, pick.unit, pick.step);
	// the first tick may lie before `min`: skip it
	for (let guard = 0; guard < 1000 && d.getTime() <= max + 1; guard++) {
		if (d.getTime() >= min - 1) values.push(d.getTime());
		advance(d, pick.unit, pick.step);
	}
	return { values, unit: pick.unit, step: pick.step };
}

// ─── band / point positions ──────────────────────────────────────────────────────────────────────────────────────

export interface Band {
	/** start of the band, px */
	start: number;
	/** width of the band, px */
	size: number;
	/** centre of the band, px */
	center: number;
}

/** `count` equal bands over [r0, r1]. */
export function bands(count: number, r0: number, r1: number): Band[] {
	const size = count > 0 ? (r1 - r0) / count : 0;
	return Array.from({ length: count }, (_, i) => ({ start: r0 + i * size, size, center: r0 + (i + 0.5) * size }));
}

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
