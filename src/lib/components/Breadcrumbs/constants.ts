// Port of the constants at the top of packages/ui-kit/src/components/Breadcrumbs/Breadcrumbs.tsx
export const BREADCRUMBS_VARIANTS = {
	primary: 'primary'
} as const;
export type BreadcrumbsVariant = (typeof BREADCRUMBS_VARIANTS)[keyof typeof BREADCRUMBS_VARIANTS];

export const BREADCRUMBS_SIZES = {
	s: 's'
} as const;
export type BreadcrumbsSize = (typeof BREADCRUMBS_SIZES)[keyof typeof BREADCRUMBS_SIZES];

export const DEFAULT_VARIANT: BreadcrumbsVariant = BREADCRUMBS_VARIANTS.primary;
export const DEFAULT_SIZE: BreadcrumbsSize = BREADCRUMBS_SIZES.s;
export const DEFAULT_CRUMBS_MAX_COUNT = 5;
export const DEFAULT_MAX_VISIBLE_CRUMBS = 3;
