// Port of packages/ui-kit/src/components/DropdownMenu/constants.ts
export const DROPDOWN_MENU_SIZES = {
	s: 's',
	m: 'm'
} as const;
export type DropdownMenuSize = (typeof DROPDOWN_MENU_SIZES)[keyof typeof DROPDOWN_MENU_SIZES];

export const DROPDOWN_MENU_VARIANTS = {
	primary: 'primary'
} as const;
export type DropdownMenuVariant = (typeof DROPDOWN_MENU_VARIANTS)[keyof typeof DROPDOWN_MENU_VARIANTS];

export const DEFAULT_DROPDOWN_MENU_VARIANT: DropdownMenuVariant = DROPDOWN_MENU_VARIANTS.primary;
export const DEFAULT_DROPDOWN_MENU_SIZE: DropdownMenuSize = DROPDOWN_MENU_SIZES.m;
export const DEFAULT_EMPTY_TEXT = 'Ничего не найдено';
