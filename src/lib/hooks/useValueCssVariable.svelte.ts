// Port of packages/ui-kit/src/hooks/useValueCssVariable.ts as a reactive hook (see also the `valueCssVariable` action).
//
// USAGE (call during component initialisation)
//   let rootEl = $state<HTMLElement>();
//   const css = useValueCssVariable(() => [`--atmr-popover-${size}-pointer-offset`, `--atmr-popover-${size}-pointer-width`], () => rootEl);
//   const pointerOffset = $derived(parseFloat(css.values[0]) + parseFloat(css.values[1]));
//
// `values` is `'0'` for every variable until the element exists (React returned `[]` during the first render, which made
// `parseFloat(...)` NaN; '0' is the value React also used for missing variables). After mount the values are read from the
// theme root of the element (closest `Theme_root_rtk_*` ancestor, else <body>) and re-read when the variable names or the
// element change.
import { readCssVariables } from '../actions/valueCssVariable.js';

export function useValueCssVariable(variables: () => string[], element: () => Element | null | undefined): { readonly values: string[] } {
	let values = $state<string[]>(variables().map(() => '0'));

	$effect(() => {
		const names = variables();
		const el = element();
		if (typeof window === 'undefined') return;
		values = readCssVariables(names, el);
	});

	return {
		get values() {
			return values;
		}
	};
}
