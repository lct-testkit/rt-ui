// Port of the parts of packages/ui-kit/src/utils/helpers.ts used by the Slider.

export const keyValues = Object.freeze({
	enter: 'Enter',
	tab: 'Tab',
	delete: 'Delete',
	esc: 'Escape',
	space: 'Space',
	up: 'ArrowUp',
	down: 'ArrowDown',
	left: 'ArrowLeft',
	right: 'ArrowRight',
	end: 'End',
	home: 'Home',
	del: 'Delete',
	backspace: 'Backspace',
	insert: 'Insert',
	pageup: 'PageUp',
	pagedown: 'PageDown',
	shift: 'Shift'
});

export function convertToUnit(str: string | number | null | undefined, unit = 'px'): string | undefined {
	if (str == null || str === '') {
		return undefined;
	} else if (isNaN(+str)) {
		return String(str);
	} else if (!isFinite(+str)) {
		return undefined;
	} else {
		return `${Number(str)}${unit}`;
	}
}

export function createRange(length: number, start = 0): number[] {
	return Array.from({ length }, (_v, k) => start + k);
}

export const hasDuplicates = (array: number[], el: number): boolean => array.filter((item) => item === el).length > 1;

export function arraysNumbersEqual(arr1: number[], arr2: number[]): boolean {
	if (arr1.length !== arr2.length) return false;
	return arr1.every((value, index) => value === arr2[index]);
}
