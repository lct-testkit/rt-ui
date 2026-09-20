// The sticky offsets of TableGrid.tsx (SEAM: sticky header / footer / extra bars).
//
// The layout is pure CSS (position: sticky, see the classes `atmr-tablegrid--header-sticky`, `atmr-tablegrid__header__container--sticky`,
// `atmr-tablegrid__extrabar__container--sticky`, `atmr-tablegrid__footer-area--sticky`, `atmr-tablegrid__cell--sticky`,
// `atmr-tablegrid__cell--stickyPosition-left / -right`); the only JS is the `--offset-sticky` custom property of the root:
// how far below the top of the scroll parent a sticky header has to stick because sticky extra bars sit above it.
import type { StyleValue } from '../../../../utils/style.js';
import { hasScrollConstraint } from '../../utils.js';

/** Height of a sticky `renders.extraBar` (px) - the value of the design. */
export const EXTRA_BAR_HEIGHT = 44.5;
/** Height of a sticky `renders.extraHeader` (px) - the value of the design. */
export const EXTRA_HEADER_HEIGHT = 64;

export interface StickyOffsetInput {
	headerSticky?: boolean;
	extraBar: boolean;
	extraBarSticky?: boolean;
	extraHeader: boolean;
	extraHeaderSticky?: boolean;
	containerStyle?: StyleValue;
	style?: StyleValue;
}

/** `--offset-sticky` (px). 0 when the table itself scrolls (`containerStyle` / `style` limit the height): the bars are outside of it. */
export function getStickyHeaderOffset({ headerSticky, extraBar, extraBarSticky, extraHeader, extraHeaderSticky, containerStyle, style }: StickyOffsetInput): number {
	const hasLayoutScroll = hasScrollConstraint(containerStyle) || hasScrollConstraint(style);
	if (!headerSticky || hasLayoutScroll) return 0;
	let res = 0;
	if (extraBar && extraBarSticky) res += EXTRA_BAR_HEIGHT;
	if (extraHeader && extraHeaderSticky) res += EXTRA_HEADER_HEIGHT;
	return res;
}
