// Port of packages/ui-kit/src/components/Pagination/constants.ts (TS enums become const objects + string unions).
// `Object.values(PAGINATION_SIZES)` etc. keep the React enum order.

export const PAGINATION_SIZES = {
	s: 's',
	m: 'm'
} as const;
export type PaginationSize = (typeof PAGINATION_SIZES)[keyof typeof PAGINATION_SIZES];

export const PAGINATION_VARIANTS = {
	primary: 'primary'
} as const;
export type PaginationVariant = (typeof PAGINATION_VARIANTS)[keyof typeof PAGINATION_VARIANTS];

export const PAGINATION_ALIGNMENT = {
	left: 'left',
	right: 'right'
} as const;
export type PaginationAlignment = (typeof PAGINATION_ALIGNMENT)[keyof typeof PAGINATION_ALIGNMENT];

export const PAGINATION_TYPES = {
	buttons: 'buttons',
	buttonsMobile: 'buttonsMobile',
	withLabel: 'withLabel',
	onlySlider: 'onlySlider'
} as const;
export type PaginationType = (typeof PAGINATION_TYPES)[keyof typeof PAGINATION_TYPES];

/** Size of the previous / next chevrons per pagination size. */
export const CHEVRON_SIZE_MAP: Record<PaginationSize, number> = {
	m: 20,
	s: 16
};
