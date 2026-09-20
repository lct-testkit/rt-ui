// Port of packages/ui-kit/src/components/InputCard/utils.ts

/** Insert a space before the chars at the given (0-based) positions: `('4111111111111111', [4, 8, 12])` -> `4111 1111 1111 1111`. */
export const getNormalizedStringWithGaps = (str: string, gaps: number[]): string =>
	str
		.split('')
		.filter((char) => char !== ' ')
		.map((char, index) => (gaps.includes(index) ? ` ${char}` : char))
		.join('');

/** Keeps the digits only. */
export const getOnlyNumbersValue = (value: string): string =>
	value
		.split('')
		.filter((char) => /^\d{1,}$/.test(char))
		.join('');
