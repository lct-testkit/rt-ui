/** EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. */
// Number and date formatting of the chart module. Russian locale by default; everything goes through `Intl`.
import type { TimeUnit } from './scale.js';

export const DEFAULT_LOCALE = 'ru-RU';

export type NumberFormatter = (value: number) => string;
export type DateFormatter = (value: Date | number) => string;

const numberCache = new Map<string, Intl.NumberFormat>();
const dateCache = new Map<string, Intl.DateTimeFormat>();

function numberFormat(locale: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
	const key = locale + JSON.stringify(options);
	let nf = numberCache.get(key);
	if (!nf) {
		try {
			nf = new Intl.NumberFormat(locale, options);
		} catch {
			nf = new Intl.NumberFormat(DEFAULT_LOCALE, options);
		}
		numberCache.set(key, nf);
	}
	return nf;
}

function dateFormat(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
	const key = locale + JSON.stringify(options);
	let df = dateCache.get(key);
	if (!df) {
		try {
			df = new Intl.DateTimeFormat(locale, options);
		} catch {
			df = new Intl.DateTimeFormat(DEFAULT_LOCALE, options);
		}
		dateCache.set(key, df);
	}
	return df;
}

/** Full number with locale grouping: 1250000 -> "1 250 000" (ru-RU), at most 2 decimals. */
export function createNumberFormat(locale = DEFAULT_LOCALE, options: Intl.NumberFormatOptions = {}): NumberFormatter {
	const nf = numberFormat(locale, { maximumFractionDigits: 2, ...options });
	return (v) => (Number.isFinite(v) ? nf.format(v) : '—');
}

/** Compact number for axes: 1250000 -> "1,3 млн", 4200 -> "4,2 тыс." (ru-RU). */
export function createCompactFormat(locale = DEFAULT_LOCALE): NumberFormatter {
	const compact = numberFormat(locale, { notation: 'compact', compactDisplay: 'short', maximumFractionDigits: 1 });
	const plain = numberFormat(locale, { maximumFractionDigits: 2 });
	// below one thousand Intl prints the plain number; small fractions keep their decimals
	return (v) => (Number.isFinite(v) ? (Math.abs(v) < 1000 ? plain.format(v) : compact.format(v)) : '—');
}

/** Share as a percentage: 0.256 -> "25,6 %" */
export function createPercentFormat(locale = DEFAULT_LOCALE, digits = 0): NumberFormatter {
	const nf = numberFormat(locale, { style: 'percent', maximumFractionDigits: digits });
	return (v) => (Number.isFinite(v) ? nf.format(v) : '—');
}

/** Formatter for a tick of a time axis, chosen by the tick unit (hour / day / month / year). */
export function createTickDateFormat(unit: TimeUnit, locale = DEFAULT_LOCALE): DateFormatter {
	const opts: Intl.DateTimeFormatOptions =
		unit === 'hour' ? { hour: '2-digit', minute: '2-digit' } : unit === 'day' ? { day: 'numeric', month: 'short' } : unit === 'month' ? { month: 'short' } : { year: 'numeric' };
	const df = dateFormat(locale, opts);
	return (d) => df.format(d);
}

/** Long date for tooltips / aria: 18 сентября 2026 г. */
export function createLongDateFormat(locale = DEFAULT_LOCALE): DateFormatter {
	const df = dateFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' });
	return (d) => df.format(d);
}

/** Month + year for tooltips of monthly data: сентябрь 2026 */
export function createMonthYearFormat(locale = DEFAULT_LOCALE): DateFormatter {
	const df = dateFormat(locale, { month: 'long', year: 'numeric' });
	return (d) => df.format(d);
}

/** Estimated width (px) of a text in the design-system font: a cheap stand-in for measuring (no DOM needed, works in SSR). */
export function estimateTextWidth(text: string, fontSize = 12): number {
	return text.length * fontSize * 0.58;
}

/** Cuts `text` with an ellipsis so that its estimated width fits `maxWidth`. */
export function truncateText(text: string, maxWidth: number, fontSize = 12): string {
	if (estimateTextWidth(text, fontSize) <= maxWidth) return text;
	const per = fontSize * 0.58;
	const keep = Math.max(1, Math.floor(maxWidth / per) - 1);
	return text.slice(0, keep).trimEnd() + '…';
}

/** Greedy word wrap into at most `maxLines` lines that fit `maxWidth` (the last line is truncated with an ellipsis when it still does not). */
export function wrapText(text: string, maxWidth: number, maxLines = 2, fontSize = 12): string[] {
	const words = text.split(/\s+/).filter(Boolean);
	if (!words.length) return [''];
	const lines: string[] = [];
	let cur = '';
	for (let i = 0; i < words.length; i++) {
		const next = cur ? `${cur} ${words[i]}` : words[i];
		if (!cur || estimateTextWidth(next, fontSize) <= maxWidth) cur = next;
		else {
			lines.push(cur);
			cur = words[i];
			if (lines.length === maxLines - 1) {
				cur = words.slice(i).join(' ');
				break;
			}
		}
	}
	lines.push(cur);
	return lines.slice(0, maxLines).map((l) => truncateText(l, maxWidth, fontSize));
}
