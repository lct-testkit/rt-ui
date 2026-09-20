// Small pure helpers shared by the TableGrid modules (ports of the tiny utils of packages/tablegird).
import type { StyleValue } from '../../utils/style.js';
import type { TableGridColumnSize } from './types.js';

/** packages/tablegird/.../layout/utils/getColumnCssKey.ts: column name -> css custom property suffix (`--column-<key>`). */
export const getColumnCssKey = (name: string): string => name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9_-]/g, '-');

/** Row / column keys are compared as strings everywhere in the selection & expand modules. */
export const normalizeRowKey = (rowKey: string | number): string => String(rowKey);

/** `column.size` -> one `grid-template-columns` track (LayoutProvider.generateCellWidth). */
export function generateCellWidth({ width, min, max }: TableGridColumnSize): string {
	if (width && !Number.isNaN(Number(width))) return `${width}px`;
	if (width) return String(width);
	if (max && typeof max === 'string' && !min) return `minmax(auto, ${max})`;
	if (min && typeof min === 'string' && !max) return `minmax(${min}, auto)`;
	if (min && max && typeof min === 'string' && typeof max === 'string') return `minmax(${min}, ${max})`;
	return 'auto';
}

const camel = (name: string): string => name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());

/** Reads one property of a `StyleValue` given as a React-like object (`maxHeight`) or a CSS string (`max-height: 1px`). */
export function readStyleProp(style: StyleValue, prop: string): string | number | undefined {
	if (!style) return undefined;
	if (typeof style === 'object') {
		const value = (style as Record<string, unknown>)[prop];
		return value === null || value === false ? undefined : (value as string | number | undefined);
	}
	for (const declaration of style.split(';')) {
		const i = declaration.indexOf(':');
		if (i < 0) continue;
		if (camel(declaration.slice(0, i).trim().toLowerCase()) === prop) return declaration.slice(i + 1).trim();
	}
	return undefined;
}

/** TableGrid.tsx `hasScrollConstraint`: does the style limit the height or make the container scrollable? */
export function hasScrollConstraint(style: StyleValue): boolean {
	if (!style) return false;
	const constraint =
		readStyleProp(style, 'maxHeight') ??
		readStyleProp(style, 'height') ??
		(readStyleProp(style, 'overflow') === 'auto' ||
			readStyleProp(style, 'overflow') === 'scroll' ||
			readStyleProp(style, 'overflowY') === 'auto' ||
			readStyleProp(style, 'overflowY') === 'scroll');
	return Boolean(constraint);
}
