// Port of packages/sidemenu/src/react/Providers/{SideMenuProvider,SideMenuPopoverContentProvider,SideMenuCollapseProvider}.tsx
// (React contexts -> Svelte contexts).
//
// * SideMenu context: `useSideMenu()` -> `{ isMenuOpen, toggle, searchQuery, setSearchQuery }` (getters are reactive, read them inside
//   `$derived` / templates). Without a provider the React default is returned (menu closed, no-op setters).
// * SideMenuPopoverContent: `true` inside the content of the collapsed-menu popover (see SideMenuCollapse).
// * SideMenuCollapse: state shared by SideMenuCollapse / CollapseTrigger / CollapseContent.
import { getContext, setContext } from 'svelte';
import type { Content } from '../../internal/types.js';
import type { MotionProp } from '../../ext/motion.svelte.js';
import { noop } from '../../utils/noop.js';

// ---- SideMenuContext -------------------------------------------------------------------------------------------------------------
export interface SideMenuContextValue {
	readonly isMenuOpen: boolean;
	toggle: () => void;
	readonly searchQuery: string;
	setSearchQuery: (value: string) => void;
	/** [ext, not in original] the `motion` prop of the SideMenu (the nested collapse / expand blocks inherit it) */
	readonly motion?: MotionProp;
}

const SIDE_MENU_KEY = Symbol('SideMenuContext');
const DEFAULT_SIDE_MENU: SideMenuContextValue = { isMenuOpen: false, toggle: noop, searchQuery: '', setSearchQuery: noop };

/** `<SideMenuContext.Provider value>` */
export const setSideMenuContext = (value: SideMenuContextValue): SideMenuContextValue => setContext(SIDE_MENU_KEY, value);
/** `useSideMenu()` */
export const useSideMenu = (): SideMenuContextValue => getContext<SideMenuContextValue | undefined>(SIDE_MENU_KEY) ?? DEFAULT_SIDE_MENU;

// ---- SideMenuPopoverContentContext -----------------------------------------------------------------------------------------------
const POPOVER_CONTENT_KEY = Symbol('SideMenuPopoverContentContext');
export const setSideMenuPopoverContent = (value: boolean): boolean => setContext(POPOVER_CONTENT_KEY, value);
/** `useSideMenuPopoverContent()` */
export const useSideMenuPopoverContent = (): boolean => getContext<boolean | undefined>(POPOVER_CONTENT_KEY) ?? false;

// ---- SideMenuCollapseContext -----------------------------------------------------------------------------------------------------
export interface SideMenuCollapseContextValue {
	readonly isCollapseOpen: boolean;
	readonly isPopoverOpen: boolean;
	closePopover: () => void;
	/** CollapseContent registers its children (React: a node, here: the children snippet) to show them in the popover */
	registerContent: (content: Content) => void;
	unregisterContent: () => void;
	/** CollapseTrigger registers its label as the popover title */
	setTitle: (title: Content) => void;
	triggerRef: { current: HTMLElement | null };
	toggle: () => void;
}

const COLLAPSE_KEY = Symbol('SideMenuCollapseContext');
const DEFAULT_COLLAPSE: SideMenuCollapseContextValue = {
	isCollapseOpen: false,
	isPopoverOpen: false,
	closePopover: noop,
	registerContent: noop,
	unregisterContent: noop,
	setTitle: noop,
	triggerRef: { current: null },
	toggle: noop
};

export const setSideMenuCollapseContext = (value: SideMenuCollapseContextValue): SideMenuCollapseContextValue => setContext(COLLAPSE_KEY, value);
/** `useSideMenuCollapse()` */
export const useSideMenuCollapse = (): SideMenuCollapseContextValue => getContext<SideMenuCollapseContextValue | undefined>(COLLAPSE_KEY) ?? DEFAULT_COLLAPSE;
