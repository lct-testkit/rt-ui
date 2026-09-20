// Port of packages/ui-kit/src/utils/function.ts

/** Empty callback used as a default for optional handlers (`onChange = noop`). */
export const noop = (..._args: any[]): void => {};

/** Handler that only calls `event.preventDefault()` (used e.g. to keep focus when clicking on buttons). */
export const preventDefaultFn = (event: { preventDefault(): void }): void => {
	event.preventDefault();
};
