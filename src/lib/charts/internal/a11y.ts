/** EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. */
// Texts for assistive technology: the visually hidden data summary of a chart and the labels of its focusable data points.
import type { NumberFormat } from '../types.js';

/** "Выручка: 12 значений, минимум 1 200 (Январь), максимум 3 400 (Ноябрь), последнее 3 100 (Декабрь)" */
export function describeSeries(name: string, values: (number | null)[], labels: string[], format: NumberFormat): string {
	let lo = -1;
	let hi = -1;
	let last = -1;
	let count = 0;
	values.forEach((v, i) => {
		if (v === null || !Number.isFinite(v)) return;
		count++;
		last = i;
		if (lo < 0 || v < (values[lo] as number)) lo = i;
		if (hi < 0 || v > (values[hi] as number)) hi = i;
	});
	if (!count) return `${name}: нет значений`;
	const at = (i: number) => `${format(values[i] as number)} (${labels[i] ?? i + 1})`;
	if (count === 1) return `${name}: одно значение, ${at(last)}`;
	return `${name}: ${count} ${plural(count, 'значение', 'значения', 'значений')}, минимум ${at(lo)}, максимум ${at(hi)}, последнее ${at(last)}`;
}

/** Russian plural form of a number: plural(2, 'значение', 'значения', 'значений') */
export function plural(n: number, one: string, few: string, many: string): string {
	const a = Math.abs(n) % 100;
	const b = a % 10;
	if (a > 10 && a < 20) return many;
	if (b > 1 && b < 5) return few;
	if (b === 1) return one;
	return many;
}
