// Port of packages/ui-kit/src/components/Tag/constants.ts
export const TAG_SIZES = { xs: 'xs', s: 's', m: 'm' } as const;
export type TagSize = keyof typeof TAG_SIZES;

export const TAG_VARIANTS = {
	primary: 'primary',
	/** @deprecated Вариант "secondary" убран в соответствии с дизайном. Используйте variant="primary" */
	secondary: 'secondary'
} as const;
export type TagVariant = keyof typeof TAG_VARIANTS;

export const DEFAULT_TAG_MORE_BUTTON_TEXT = 'Добавить';
export const DEFAULT_SIZE: TagSize = TAG_SIZES.m;
export const DEFAULT_VARIANT: TagVariant = TAG_VARIANTS.primary;

const warnedComponents = new Set<string>();

export const warnDeprecatedSecondaryVariant = (componentName: string): void => {
	if (warnedComponents.has(componentName)) return;

	// eslint-disable-next-line no-console
	console.warn(`[${componentName}] вариант "secondary" убран в соответствии с дизайном. Используйте variant="primary"`);
	warnedComponents.add(componentName);
};
