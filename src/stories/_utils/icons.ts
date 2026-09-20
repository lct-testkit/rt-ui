// Port of the icon part of stories-app/src/utils/storybook.tsx
//
// React kept ready-made ELEMENTS in the maps (`ICONS.search = <Search />`) and stories passed them to node props:
//     iconPrefix={ICONS[args.iconPrefix]}
// Svelte node props are Snippets, so the maps here hold the icon COMPONENTS and `IconByName.svelte` renders them:
//     <Button label="x">                                     (Button takes `iconPrefix?: Content` = Snippet | string | ...)
//       {#snippet iconPrefix()}<IconByName name="search" />{/snippet}
//     </Button>
//   or, as a component prop:   <Button {iconPrefix} />  with  {#snippet iconPrefix()}<IconByName name={args.iconPrefix} set="small" />{/snippet}
//
//   set = 'icons' (ICONS, default) | 'small' (ICONS_SMALL) | 'dropdownMenu' (ICONS_DROPDOWN_MENU) | 'tree' (ICONS_TREE)
//
// Direct component imports (no barrel), see CONVENTIONS.md §1.
import type { Component } from 'svelte';
import Filter16 from '$lib/icons/16/action/Filter16.svelte';
import PasswordShow16 from '$lib/icons/16/action/PasswordShow16.svelte';
import PasswordHide16 from '$lib/icons/16/action/PasswordHide16.svelte';
import ArrowRight16 from '$lib/icons/16/navigation/ArrowRight16.svelte';
import ArrowRight from '$lib/icons/24/navigation/ArrowRight.svelte';
import SettingsAdjust from '$lib/icons/24/action/SettingsAdjust.svelte';
import SettingsAdjust16 from '$lib/icons/16/action/SettingsAdjust16.svelte';
import Search from '$lib/icons/24/action/Search.svelte';
import Search16 from '$lib/icons/16/action/Search16.svelte';
import DocumentText from '$lib/icons/24/document/DocumentText.svelte';
import Folder from '$lib/icons/24/document/Folder.svelte';
import FolderOpen from '$lib/icons/24/document/FolderOpen.svelte';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type IconComponent = Component<any>;

export const EXAMPLE_ICONS = {
	settings: 'settings',
	arrowRight: 'arrowRight',
	search: 'search',
	search16: 'search16',
	arrowRight16: 'arrowRight16',
	settingsAdjust16: 'settingsAdjust16'
} as const;

export const EXAMPLE_ICONS_SMALL = {
	passwordShow16: 'passwordShow16',
	passwordHide16: 'passwordHide16',
	filter16: 'filter16'
} as const;

export const EXAMPLE_ICONS_DROPDOWN_MENU = {
	true: 'true',
	search16: 'search16',
	arrowRight16: 'arrowRight16',
	settingsAdjust16: 'settingsAdjust16'
} as const;

export const EXAMPLE_ICONS_TREE = {
	document: 'document',
	folder: 'folder',
	folderOpen: 'folderOpen',
	settings: 'settings',
	arrowRight: 'arrowRight',
	search: 'search',
	search16: 'search16'
} as const;

/** React `ICONS`: the 24px icons plus a few 16px ones. */
export const ICONS: Record<string, IconComponent> = {
	settings: SettingsAdjust,
	arrowRight: ArrowRight,
	search: Search,
	search16: Search16,
	arrowRight16: ArrowRight16,
	settingsAdjust16: SettingsAdjust16
};

/** React `ICONS_SMALL` (16px icons for small inputs). */
export const ICONS_SMALL: Record<string, IconComponent> = {
	passwordShow16: PasswordShow16,
	passwordHide16: PasswordHide16,
	filter16: Filter16
};

/** React `ICONS_DROPDOWN_MENU`: `'true'` stands for the boolean `true` (= "show the default icon"), the rest are icons. */
export const ICONS_DROPDOWN_MENU: Record<string, IconComponent | true> = {
	true: true,
	search16: Search16,
	arrowRight16: ArrowRight16,
	settingsAdjust16: SettingsAdjust16
};

/** React `ICONS_TREE`. */
export const ICONS_TREE: Record<string, IconComponent> = {
	document: DocumentText,
	folder: Folder,
	folderOpen: FolderOpen,
	settings: SettingsAdjust,
	arrowRight: ArrowRight,
	search: Search,
	search16: Search16
};

export type IconSet = 'icons' | 'small' | 'dropdownMenu' | 'tree';

export const ICON_SETS: Record<IconSet, Record<string, IconComponent | true>> = {
	icons: ICONS,
	small: ICONS_SMALL,
	dropdownMenu: ICONS_DROPDOWN_MENU,
	tree: ICONS_TREE
};

/**
 * Value the React story would have passed for `ICON_MAP[name]`: an icon component, `true` (dropdown menu default icon)
 * or `undefined` (no icon / unknown name).
 */
export function getIcon(name: string | null | undefined, set: IconSet = 'icons'): IconComponent | true | undefined {
	return name ? ICON_SETS[set][name] : undefined;
}

/** Control `options` helper of the React storybook: adds the "not set" entry (`'Не задано': undefined`). */
export const getStoryOptions = <T extends Record<string, unknown>>(options: T): T & { 'Не задано': undefined } =>
	Object.assign({ 'Не задано': undefined }, options);
