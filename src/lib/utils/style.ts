// Svelte-only helper (no React counterpart): React components take `style` as a CSSProperties object
// (`style={{ width: 300, '--x': 1 }}`), Svelte elements take a CSS string. `styleToString` converts the former to the latter
// so ported components can accept both forms and merge them.

export type StyleObject = Record<string, string | number | null | undefined | false>;
export type StyleValue = string | StyleObject | null | undefined;

// React does not add "px" to these
const UNITLESS = new Set([
	'animation-iteration-count', 'aspect-ratio', 'border-image-outset', 'border-image-slice', 'border-image-width', 'box-flex',
	'box-flex-group', 'box-ordinal-group', 'column-count', 'columns', 'flex', 'flex-grow', 'flex-positive', 'flex-shrink',
	'flex-negative', 'flex-order', 'font-weight', 'grid-area', 'grid-row', 'grid-row-end', 'grid-row-span', 'grid-row-start',
	'grid-column', 'grid-column-end', 'grid-column-span', 'grid-column-start', 'line-clamp', 'line-height', 'opacity', 'order',
	'orphans', 'tab-size', 'widows', 'z-index', 'zoom', 'fill-opacity', 'flood-opacity', 'stop-opacity', 'stroke-dasharray',
	'stroke-dashoffset', 'stroke-miterlimit', 'stroke-opacity', 'stroke-width'
]);

const kebab = (name: string): string => (name.startsWith('--') ? name : name.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`).replace(/^ms-/, '-ms-'));

/** `{ width: 300, marginTop: '4px', '--x': 2 }` -> `width: 300px; margin-top: 4px; --x: 2;` (empty -> `undefined`). */
export function styleToString(...styles: StyleValue[]): string | undefined {
	const parts: string[] = [];
	for (const style of styles) {
		if (!style) continue;
		if (typeof style === 'string') {
			const s = style.trim();
			if (s) parts.push(s.endsWith(';') ? s : `${s};`);
			continue;
		}
		for (const [key, value] of Object.entries(style)) {
			if (value === null || value === undefined || value === false || value === '') continue;
			const name = kebab(key);
			const withUnit = typeof value === 'number' && value !== 0 && !name.startsWith('--') && !UNITLESS.has(name) ? `${value}px` : String(value);
			parts.push(`${name}: ${withUnit};`);
		}
	}
	return parts.length ? parts.join(' ') : undefined;
}
