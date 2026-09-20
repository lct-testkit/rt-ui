// Port of packages/ui-kit/src/components/Tabs/context.ts (React context -> Svelte context).
//
// React: TabsGroup inspects its `children` (`Children.toArray(children).filter(isTabsItemElement)`) to read every TabsItem's props
// (`index`, `label`, `disabled`), renders only the visible ones (`maxVisibleTabs`) and keeps refs to their DOM nodes.
// Svelte has no element children to inspect, so every TabsItem REGISTERS itself in the group (in creation = declaration order) through
// `register(tab)`, and asks `isVisible(tab)` whether it has to render its <button> (overflowed tabs render nothing, like React).
import { getContext, setContext } from 'svelte';
import type { Content } from '../../internal/types.js';
import type { TabsSize, TabsVariant } from './constants.js';

/** What a TabsItem tells its TabsGroup (React: `tab.props.*` of the child element + `tabRefs.current[index]`). */
export interface TabsItemRegistration {
	readonly index: string | undefined;
	readonly label: Content;
	readonly disabled: boolean | undefined;
	/** React: `Object.prototype.hasOwnProperty.call(props, 'disabled')` - such tabs are skipped by the arrow-key navigation */
	readonly hasDisabledProp: boolean;
	/** React: `tabRefs.current[index]?.focus()` (no-op while the tab is not rendered) */
	focus(): void;
}

export interface TabsContextValue {
	readonly size?: TabsSize;
	readonly variant?: TabsVariant;
	readonly scrollable?: boolean;
	readonly verticalFill?: boolean;
	readonly disabledAll?: boolean;
	readonly activeIndex?: string;
	/** roving tabindex owner (`tIndex`) */
	readonly tIndex?: string;
	readonly tabsRef?: HTMLDivElement | null;
	handleChange?: (index: string) => Promise<void>;
	/** Svelte-only: registers a TabsItem, returns the unregister function */
	register?: (tab: TabsItemRegistration) => () => void;
	/** Svelte-only: false for tabs that were moved into the overflow menu (`maxVisibleTabs`) */
	isVisible?: (tab: TabsItemRegistration) => boolean;
}

const TABS_CONTEXT_KEY = Symbol('TabsContext');

/** `TabsContextProvider` */
export const setTabsContext = (value: TabsContextValue): TabsContextValue => setContext(TABS_CONTEXT_KEY, value);

/** `useContext(TabsContext)` (React default value is `{}`) */
export const getTabsContext = (): TabsContextValue => getContext<TabsContextValue | undefined>(TABS_CONTEXT_KEY) ?? {};
