// Port of packages/ui-kit/src/utils/InputNumberStepper/InputNumberStepper.ts and packages/ui-kit/src/utils/number.ts

import { NUMBER_STEPPER_VAL_MAX_LENGTH } from './constants.js';

/** `1234567` -> `'1 234 567'` (groups of three, separated by a space) */
export const getDisplayValue = (value: number | string): string => {
	let res = String(value);
	if (res.length > 3) {
		const transformArr = res
			.split('')
			.reverse()
			.reduce<string[]>((acc, num, index) => {
				acc.push(num);
				if ((index + 1) % 3 === 0) {
					acc.push(' ');
				}
				return acc;
			}, []);
		res = transformArr.reverse().join('').trim();
	}
	return res;
};

export const displayValToNumberVal = (value: string): number => Number(value.split(' ').join(''));

export const checkNumStepperValLength = (current: string): boolean => current.length <= NUMBER_STEPPER_VAL_MAX_LENGTH;

export const addSizeInputIncrement = (str: string): number => {
	let counter = 0;
	str.split('').forEach((elem) => {
		if (elem === ' ') {
			counter += 1;
		}
	});
	return counter;
};

export const clamp = (value: number, min?: number, max?: number): number => {
	if (typeof min === 'number' && typeof max === 'number') {
		return Math.min(Math.max(value, min), max);
	}
	return value;
};

export const withinTheInterval = (value: number, min?: number, max?: number): boolean => {
	if (typeof max === 'number' && !min) {
		return value <= max;
	}
	if (typeof min === 'number' && !max) {
		return value >= min;
	}
	if (typeof min === 'number' && typeof max === 'number') {
		return value >= min && value <= max;
	}
	return true;
};
