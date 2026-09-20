// Port of packages/ui-kit/src/components/Box/utils.tsx (`useBoxMods`, `useBoxWithMods`).
//
// A "modifier prop" is a Box prop with a modifier prefix: `opened_bg`, `disabled_cursor`, `selected_px` ...
// Accordion / AccordionSummary / AccordionDetails / ListItem compute the list of ACTIVE modifiers and hand every Box prop
// through `boxWithMods`: plain props are kept, `<mod>_<prop>` props are kept (as `<prop>`) only when `<mod>` is active,
// all the others are dropped. Later keys win, exactly like the `reduce` in the React version.
//
// USAGE
//   const mods = $derived(boxMods({ opened: isOpen, disabled }));      // ['opened'] | ['opened', 'disabled'] | ...
//   const boxProps = $derived(boxWithMods(rest, mods));
//   <Box {...boxProps}>...</Box>
//
// (React hooks, but neither of them needs a component context, so they are plain functions here.)

/** Names of the truthy entries: `{ opened: true, disabled: false }` -> `['opened']`. */
export function boxMods(objMods: Record<string, unknown>): string[] {
	return Object.keys(objMods).filter((mod) => objMods[mod]);
}

/** Resolve `<mod>_<prop>` entries of `boxProps` against the active `mods`. */
export function boxWithMods<T extends Record<string, unknown>>(boxProps: T, mods: readonly string[]): Record<string, any> {
	return Object.keys(boxProps).reduce<Record<string, unknown>>((acc, itemKey) => {
		const keys = itemKey.split('_');
		if (keys.length === 1) {
			return { ...acc, [keys[0]]: boxProps[keys[0]] };
		}
		if (mods.length > 0) {
			for (const mod of mods) {
				if (keys.length > 1 && keys[0] === mod) {
					return { ...acc, [keys[1]]: boxProps[itemKey] };
				}
			}
		}
		return acc;
	}, {});
}
