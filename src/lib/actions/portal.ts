// Port of React `createPortal(children, document.body)` (as used by Popover, Tooltip, DropdownMenu, Modal, Drawer, ...)
// and of the theme wrapper of usePopper's `createPortal`.
//
// USAGE
//   <div class="atmr-popover" use:portal>...</div>                         -> node is moved to the END of document.body
//   <div use:portal={{ target: someElement }}>...</div>                    -> ... or appended to another element / selector
//   <div use:portal={{ themeFrom: triggerEl }}>...</div>                   -> see "theme wrapper" below
//   {#if useInPortal}<div use:portal>{@render body()}</div>{:else}{@render body()}{/if}   (conditional portal without
//                                                                            duplicating markup: keep the markup in a snippet)
//
// SEMANTICS (same DOM as React)
//  * the node is `appendChild`-ed to `document.body` when the action mounts (so it is the last top-level node at that time),
//    and removed again when the action is destroyed (i.e. when the element / its `{#if}` block goes away).
//  * theme wrapper: usePopper's React `createPortal` wraps the portalled content in `<div class="Theme_root_rtk_...">` when the
//    trigger lives inside a themed container that is NOT <body> (so CSS variables of that theme reach the detached popper).
//    Pass `themeFrom` (the trigger element or `() => trigger`) to get the same wrapper. Without a themed non-body ancestor no
//    wrapper is added (the common case: the theme class is on <body>).
//
// CAVEATS
//  * Svelte removes DOM ranges by walking `nextSibling` from the first to the last root node of a block. Put `use:portal` on
//    an element that is the ONLY root node of its `{#if}` branch / snippet / component (or is neither the first nor the last
//    root node of a multi-root fragment), otherwise removal of the block may walk through <body>.
//  * DOM events bubble through the DOM tree, not through the logical component tree (React synthetic events bubbled through
//    portals to the React parent). If a ported component relied on that (e.g. `onClick` on a root that also contains the
//    portalled popup), attach the handler to the portalled node too.
//  * Svelte's delegated events (`onclick` ...) do work for portalled nodes (they are also captured on `document`).
import type { Action } from 'svelte/action';

export interface PortalOptions {
	/** Where to append the node. Element or CSS selector; default `document.body`. */
	target?: HTMLElement | string | null;
	/** Element (or getter) whose closest `Theme_root_rtk_*` ancestor (if it is not <body>) is re-created around the node. */
	themeFrom?: Element | null | undefined | (() => Element | null | undefined);
}

export const THEME_CLASS_PATTERN = 'Theme_root_rtk_';

/**
 * `closest('[class*="Theme_root_rtk_"]')` of `from`; returns the theme class name only when that element is not <body>
 * (mirrors `useTheme` in packages/ui-kit/src/hooks/usePopper/usePopper.tsx), otherwise `null`.
 */
export function findThemeClassName(from: Element | null | undefined): string | null {
	if (!from || typeof from.closest !== 'function') return null;
	const elem = from.closest(`[class*="${THEME_CLASS_PATTERN}"]`);
	if (!elem || elem.tagName.toLowerCase() === 'body') return null;
	return Array.from(elem.classList).find((cls) => cls.includes(THEME_CLASS_PATTERN)) ?? null;
}

type PortalParam = PortalOptions | HTMLElement | string | null | undefined;

const normalize = (options: PortalParam): PortalOptions => {
	if (!options) return {};
	if (typeof options === 'string' || (typeof HTMLElement !== 'undefined' && options instanceof HTMLElement)) return { target: options };
	return options as PortalOptions;
};

function resolveTarget(target: PortalOptions['target']): HTMLElement {
	if (typeof target === 'string') return (document.querySelector(target) as HTMLElement | null) ?? document.body;
	return target ?? document.body;
}

export const portal: Action<HTMLElement, PortalParam> = (node, initial) => {
	let wrapper: HTMLElement | null = null;
	let opts = normalize(initial);

	function mount() {
		const target = resolveTarget(opts.target);
		const from = typeof opts.themeFrom === 'function' ? opts.themeFrom() : opts.themeFrom;
		const themeClass = findThemeClassName(from);
		if (themeClass) {
			wrapper = document.createElement('div');
			wrapper.className = themeClass;
			wrapper.appendChild(node);
			target.appendChild(wrapper);
		} else {
			target.appendChild(node);
		}
	}

	function unmount() {
		if (wrapper) {
			wrapper.remove();
			wrapper = null;
		} else {
			node.remove();
		}
	}

	mount();

	return {
		update(next) {
			const nextOpts = normalize(next);
			// re-parent only when the target really changed
			const changed = resolveTarget(nextOpts.target) !== resolveTarget(opts.target);
			opts = nextOpts;
			if (changed) {
				unmount();
				mount();
			}
		},
		destroy() {
			unmount();
		}
	};
};
