// Port of packages/tablegird/src/components/TableGrid/constants.ts

export const FILTER_TYPES = {
	operator: 'operators',
	select: 'select'
} as const;

export const DEFAULT_OPERATORS = {
	equal: 'equal',
	start: 'start',
	middle: 'middle',
	end: 'end'
} as const;

export const FILTER_POSITIONS = {
	popover: 'popover',
	inline: 'inline'
} as const;

export const SORT_VARIANTS = {
	asc: 'asc',
	desc: 'desc',
	default: 'default'
} as const;

export const TABLEGRID_VARIANTS = {
	primary: 'primary'
} as const;

export const TABLEGRID_SIZES = {
	s: 's',
	m: 'm'
} as const;

/** CSS grid row (`--row-index`) of the first data row; every next row takes the next line (expandable rows take two). */
export const START_ROW_POSITION = 3;
/** CSS grid row (`--row-index`) of the header row. */
export const HEADER_ROW_POSITION = 2;
