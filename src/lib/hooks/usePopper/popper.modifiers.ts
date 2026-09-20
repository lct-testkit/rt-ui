// Port of packages/ui-kit/src/hooks/usePopper/popper.modifiers.ts
import type { Modifier } from '@popperjs/core';

/** Makes the popper as wide as its reference (trigger). usePopper enables it unless `widthFitContent` is set. */
export const matchWidth: Modifier<'matchWidth', object> = {
	name: 'matchWidth',
	enabled: true,
	phase: 'beforeWrite',
	requires: ['computeStyles'],
	fn: ({ state }) => {
		state.styles.popper.width = `${state.rects.reference.width}px`;
	},
	effect: ({ state }) => {
		return () => {
			const reference = state.elements.reference as HTMLElement;
			(state.elements.popper as HTMLElement).style.width = `${reference.offsetWidth}px`;
		};
	}
};
