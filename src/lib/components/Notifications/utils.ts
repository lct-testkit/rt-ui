// Port of packages/ui-kit/src/components/Notifications/utils.ts
// React wrapped ready-made <FunctionButton/> elements; Svelte keeps the button *descriptors* (props) instead and the
// component renders <FunctionButton {...props}/> for each of them.

/** At most two action buttons are shown; `id` is the React `key` (index + 3). */
export const createActionButtons = <T>(actionButtons: T[] = []): { button: T; id: number }[] =>
	actionButtons.slice(0, 2).map((button, index) => ({ button, id: index + 3 }));
