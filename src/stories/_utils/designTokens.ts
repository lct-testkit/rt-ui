// Port of the logic behind stories-app/src/stories/Design Tokens/*:
//   utils.tsx (tokensDecorator, colorCategoriesMap, stringToPascalCase), hooks/useTokens.ts, hooks/useTokensByName.ts,
//   addons/design-tokens-addon/theme.ts (getStorybookThemeName) and .storybook/preview.js (parameters.designToken.themeToFileMapper).
//
// How the React pages get their data: the decorator resolves a theme name from the Storybook *globals* (`theme` / `cssVariables`),
// maps it through `themeToFileMapper` and fetches `./<file>.source.json` (the JSON produced by the storybook-design-token addon:
// `{ cssTokens: { categories: [{ name, tokens: [{ name, value, rawValue, description, ... }] }] } }`).
// In the reference build no global is ever set, so no theme resolves, nothing is fetched and every token page renders an EMPTY story
// root. This port keeps exactly that behaviour, and renders the full tables as soon as a theme is selected the same way
// (`/story/<id>?globals=cssVariables:Rostelecom Light Theme`) and `/<file>.source.json` is served.
import { base } from '$app/paths';

export interface Token {
	name: string;
	value?: string;
	rawValue?: string;
	description?: string;
	[key: string]: unknown;
}
export interface TokenCategory {
	name: string;
	tokens?: Token[];
	[key: string]: unknown;
}
export interface AllTokens {
	cssTokens?: { categories: TokenCategory[] };
	[key: string]: unknown;
}

/** `.storybook/preview.js` → `parameters.designToken.themeToFileMapper` */
export const THEME_TO_FILE_MAPPER: Record<string, string> = {
	'Rostelecom Light Theme': 'rostelecom-default-light',
	'Rostelecom Dark Theme': 'rostelecom-default-dark',
	'Rostelecom Purple Light Theme': 'rostelecom-purple-light',
	'Rostelecom Purple Dark Theme': 'rostelecom-purple-dark'
};

const STORYBOOK_THEME_GLOBAL_KEY = 'theme';
const LEGACY_THEME_GLOBAL_KEY = 'cssVariables';

/** Storybook globals of the page URL (`?globals=cssVariables:Rostelecom Light Theme;theme:x`). */
function getGlobals(): Record<string, string> {
	const out: Record<string, string> = {};
	const raw = new URLSearchParams(location.search).get('globals');
	for (const pair of raw ? raw.split(';') : []) {
		const i = pair.indexOf(':');
		if (i > 0) out[pair.slice(0, i)] = pair.slice(i + 1);
	}
	return out;
}

/**
 * `getThemeNameConfigStorybook` + `getStorybookThemeName`: `globals.theme || globals.cssVariables || parameters.cssVariables.theme || cookie`.
 * The story parameters never define `cssVariables` (so `parameters.cssVariables.theme` and the `files`-gated cookie are always empty).
 */
export function getThemeName(): string | undefined {
	const globals = getGlobals();
	return globals[STORYBOOK_THEME_GLOBAL_KEY] || globals[LEGACY_THEME_GLOBAL_KEY] || undefined;
}

/** `useTokens`: fetch the token source of the theme (undefined when the theme is unknown to `themeToFileMapper`). */
export async function loadTokens(theme: string | undefined): Promise<AllTokens | undefined> {
	const file = theme ? THEME_TO_FILE_MAPPER[theme] : undefined;
	if (!file) return undefined;
	const response = await fetch(`${base}/${file}.source.json`);
	return JSON.parse(await response.text()) as AllTokens;
}

/** Group tokens by the `index`-th part of their `--a-b-c` name. */
export function groupTokens(tokens: Token[], index: number): Record<string, Token[]> {
	return tokens.reduce<Record<string, Token[]>>((acc, item) => {
		const key = item.name.split('-')[index];
		return { ...acc, [key]: [...(acc[key] || []), item] };
	}, {});
}

/** `useTokensByName(category, index = 3)` */
export function tokensByName(allTokens: AllTokens | undefined, category: string, index = 3) {
	const tokensByCategory = allTokens?.cssTokens?.categories.find((item) => item.name === category);
	const sortedTokens = tokensByCategory?.tokens ? groupTokens(tokensByCategory.tokens, index) : undefined;
	return { allTokens, sortedTokens, tokensByCategory };
}

export const colorCategoriesMap: Record<string, string> = {
	bg: 'Background',
	fg: 'Foreground',
	accent: 'Accent',
	neutral: 'Neutral',
	base: 'Base',
	border: 'Border',
	disappear: 'Disappear',
	error: 'Error',
	focus: 'Focus',
	info: 'Info',
	none: 'None',
	static: 'Static',
	status: 'Status',
	success: 'Success',
	warning: 'Warning'
};

/** `border-radius-s` → `BorderRadiusS` (the original is the same helper spelled with expanded Unicode classes). */
export const stringToPascalCase = (str: string): string =>
	str
		.replace(/([a-z])([A-Z])/g, '$1 $2')
		.replace(/[-_]+|[^\p{L}\p{N}]/gu, ' ')
		.toLowerCase()
		.replace(/(?:^|[^\p{L}\p{N}])([\p{L}\p{N}])/gu, (_, letter: string) => letter.toUpperCase())
		.replace(/\s+/g, '');
