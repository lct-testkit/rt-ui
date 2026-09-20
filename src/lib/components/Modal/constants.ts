// Port of packages/ui-kit/src/components/Modal/constants.ts
export const SCROLL_BEHAVIOR_MAP = {
	inside: 'inside',
	outside: 'outside'
} as const;
export type ScrollBehavior = (typeof SCROLL_BEHAVIOR_MAP)[keyof typeof SCROLL_BEHAVIOR_MAP];

/** Default `marginTop` (px): distance between the modal and the top of the viewport (and, doubled, the overlay height padding). */
export const DEFAULT_MARGIN_TOP = 56;
