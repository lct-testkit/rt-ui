// Port of packages/ui-kit/src/hooks/usePopper/constants.ts
// Atomaro placement names -> Popper.js placements.

export const PLACEMENTS = {
	auto: 'auto',
	top: 'top',
	bottom: 'bottom',
	right: 'right',
	left: 'left',
	topLeft: 'topLeft',
	topRight: 'topRight',
	bottomLeft: 'bottomLeft',
	bottomRight: 'bottomRight',
	leftTop: 'leftTop',
	leftBottom: 'leftBottom',
	rightTop: 'rightTop',
	rightBottom: 'rightBottom'
} as const;

export const PLACEMENTS_MAP = {
	auto: 'auto',
	top: 'top',
	topRight: 'top-end',
	topLeft: 'top-start',
	bottom: 'bottom',
	bottomRight: 'bottom-end',
	bottomLeft: 'bottom-start',
	left: 'left',
	leftBottom: 'left-end',
	leftTop: 'left-start',
	right: 'right',
	rightBottom: 'right-end',
	rightTop: 'right-start'
} as const;

/** `PlacementsType` of `@atomaro/ui-kit/hooks/usePopper/types`. */
export type PlacementsType = keyof typeof PLACEMENTS_MAP;
