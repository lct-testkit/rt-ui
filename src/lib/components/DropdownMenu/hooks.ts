// Port of packages/ui-kit/src/components/DropdownMenu/hooks.tsx (`useMenuItems`).
// No React state inside, so it is a plain function (usable inside `$derived`).
//
// The result items contain ONLY the fields below (like in React: other item fields, e.g. `textColor`, are dropped);
// this exact object is what `onClickItem(item)` receives. Titles and dividers lose `prefix` / `suffix` / `checkIcon`.
import type { Content } from '../../internal/types.js';
import type { DropdownMenuItem } from './types.js';

export interface UseMenuItemsProps {
	items: DropdownMenuItem[];
	disabledItems?: (string | number)[];
	hideSelectedItems?: boolean;
	checkIcon?: Content | boolean;
}

export function useMenuItems({ items, disabledItems, hideSelectedItems, checkIcon }: UseMenuItemsProps): DropdownMenuItem[] {
	return items
		.map(({ key, prefix, disabled = false, suffix, isTitle, isDivider, error, value, hint, checkIcon: check, isSelected = false }) => {
			const isDisabled = disabled ? true : !!disabledItems?.includes(key);
			return {
				key,
				isTitle,
				isDivider,
				error,
				value,
				hint,
				isSelected,
				prefix: undefined,
				checkIcon: undefined,
				disabled: isDisabled,
				suffix: undefined,
				...(!isTitle && !isDivider && { isSelected, prefix, checkIcon: check || checkIcon, disabled: isDisabled, suffix })
			} as DropdownMenuItem;
		})
		.filter((o) => (hideSelectedItems ? !o.isSelected : true));
}
