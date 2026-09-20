// Port of packages/ui-kit/src/hooks/useValueCssVariable.ts
//
// Reads CSS custom properties from the *theme root* of an element (the closest ancestor carrying one of the four
// `Theme_root_rtk_*` classes, falling back to <body>). Components use it to feed design-token values (sizes of a popover
// pointer, ...) into JS code such as usePopper offsets.
//
// USAGE (action: values are delivered through `onChange`, first call happens right after mount)
//   let pointer = $state(['0', '0']);
//   <div use:valueCssVariable={{ variables: [`--atmr-popover-${size}-pointer-offset`, `--atmr-popover-${size}-pointer-width`],
//                                onChange: (v) => (pointer = v) }}>
//   const offset = $derived(parseFloat(pointer[0]) + parseFloat(pointer[1]));
//
// USAGE (reactive hook, call during component init)  -> hooks/useValueCssVariable.svelte.ts
//   const css = useValueCssVariable(() => [`--atmr-popover-${size}-pointer-offset`], () => rootEl);
//   css.values[0]
//
// Missing variables yield '0' (and `console.warn('No css variable found for --x')`), exactly like React.
import type { Action } from 'svelte/action';

const THEME_CLASSES = ['Theme_root_rtk_default_light', 'Theme_root_rtk_default_dark', 'Theme_root_rtk_purple_light', 'Theme_root_rtk_purple_dark'];

/** Closest ancestor-or-self carrying a theme class, or `null` (React: `themeElement()`). */
export function getThemeElement(element: Element | null | undefined): Element | null {
	let el: Element | null | undefined = element;
	while (el && !THEME_CLASSES.some((cls) => el!.classList.contains(cls))) {
		el = el.parentElement;
	}
	return el ?? null;
}

/** Value of a CSS variable on the theme root of `element` (trimmed); `'0'` when it is not defined. */
export function readCssVariable(variable: string, element?: Element | null): string {
	if (typeof window === 'undefined' || typeof document === 'undefined') return '0';
	const value = getComputedStyle(getThemeElement(element) || document.body, null).getPropertyValue(variable).trim();
	if (!value) {
		console.warn(`No css variable found for ${variable}`);
	}
	return value || '0';
}

export function readCssVariables(variables: string[], element?: Element | null): string[] {
	return variables.map((v) => readCssVariable(v, element));
}

export interface ValueCssVariableParams {
	variables: string[];
	/** Called with the values (same order as `variables`) after mount and whenever `variables` change. */
	onChange: (values: string[]) => void;
}

export const valueCssVariable: Action<HTMLElement, ValueCssVariableParams> = (node, initial) => {
	let params = initial;
	let key = '';

	function run() {
		const nextKey = JSON.stringify(params.variables);
		if (nextKey === key) return;
		key = nextKey;
		params.onChange(readCssVariables(params.variables, node));
	}
	run();

	return {
		update(next) {
			params = next;
			run();
		}
	};
};
