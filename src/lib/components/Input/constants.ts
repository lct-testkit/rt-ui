// Port of packages/ui-kit/src/components/Input/constants.ts (TS enums become const objects + string unions).
// `Object.values(INPUT_SIZES)` keeps the React enum order: s, m, l.

export const INPUT_SIZES = {
	s: 's',
	m: 'm',
	l: 'l'
} as const;
export type InputSize = (typeof INPUT_SIZES)[keyof typeof INPUT_SIZES];

/** Size of the clear / error icons per input size. */
export const INPUT_ICON_SIZE_MAP: Record<InputSize, number> = {
	l: 24,
	m: 20,
	s: 16
};

export const INPUT_VARIANTS = {
	primary: 'primary'
} as const;
export type InputVariant = (typeof INPUT_VARIANTS)[keyof typeof INPUT_VARIANTS];
