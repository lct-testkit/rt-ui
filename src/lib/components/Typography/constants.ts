// Port of packages/ui-kit/src/components/Typography/constants.ts
export const TYPOGRAPHY_VARIANTS = {
	'display-s': 'display-s',
	'display-m': 'display-m',
	'display-l': 'display-l',
	'heading-h1': 'heading-h1',
	'heading-h2': 'heading-h2',
	'heading-h3': 'heading-h3',
	'heading-h4': 'heading-h4',
	'heading-h5': 'heading-h5',
	'body-s': 'body-s',
	'body-m': 'body-m',
	'body-l': 'body-l',
	'description-s': 'description-s',
	'description-m': 'description-m',
	'description-l': 'description-l'
} as const;

export type TypographyVariant = (typeof TYPOGRAPHY_VARIANTS)[keyof typeof TYPOGRAPHY_VARIANTS];

export const DEFAULT_TYPOGRAPHY_VARIANT: TypographyVariant = TYPOGRAPHY_VARIANTS['display-s'];
