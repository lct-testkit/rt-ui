// Port of packages/ui-kit/src/components/Notifications/hooks.ts
// (React hooks -> Svelte "hook" functions that must be called during component init; inputs are passed as getters so the latest
//  props are read, the way React re-creates the callbacks on every render)
import { untrack } from 'svelte';
import type { Action } from 'svelte/action';
import { getNotificationsStack, type NotificationsStack } from '../wrappers/ToastNotificationsProvider/NotificationsStackContext.js';

/**
 * `useNotifications({ onClose, onOpen })`: `isOpen` becomes true right after mount (and `onOpen` is called) - React does it in
 * `useEffect(handleOpenNotification, [handleOpenNotification])`, i.e. again whenever the `onOpen` identity changes.
 *
 * NOTE (React behaviour kept on purpose): `onOpen` defaults to a fresh `function () {}` on every render, so a component that is not given
 * an `onOpen` re-runs that effect after EVERY render, and thus re-opens itself right after `handleCloseNotification` closed it
 * (the close button of a bare InlineNotification restarts its exit transition as an enter). Only a stable, user-provided `onOpen` lets
 * the notification stay closed. Here `options.onOpen()` returns `undefined` for "not provided": the effect then also depends on `open`
 * (every state change is a render) and re-opens after the DOM has been updated (like the re-render caused by `setOpen(true)`).
 */
export function useNotifications(options: { onOpen: () => (() => void) | undefined; onClose: () => (() => void) | undefined }) {
	let open = $state(false);
	let opened = false;

	// `$derived`: the effect re-runs only when the callback really changed (React compares the `onOpen` identity)
	const onOpenCallback = $derived(options.onOpen());
	$effect(() => {
		const onOpen = onOpenCallback;
		if (onOpen === undefined) void open; // default `onOpen` = a new function per render
		untrack(() => {
			if (!opened) {
				opened = true;
				open = true;
			} else if (!open) {
				queueMicrotask(() => {
					open = true;
				});
			}
			onOpen?.();
		});
	});

	const handleCloseNotification = () => {
		open = false;
		options.onClose()?.();
	};

	return {
		get isOpen() {
			return open;
		},
		handleCloseNotification
	};
}

/**
 * `useNotificationsHeight(wrapper, isShouldHaveHeight)`: sets the inline `height` of the wrapper to its scrollHeight (open) or 0px, on
 * every change and on window resize. React only gets the wrapper element on the second render (after `isOpen` became true),
 * so nothing is written before the notification has been opened.
 */
export function useNotificationsHeight(getWrapper: () => HTMLElement | null | undefined, getIsShouldHaveHeight: () => boolean) {
	let opened = false;

	const createCollapse = () => {
		const wrapper = getWrapper();
		if (wrapper) {
			wrapper.style.height = getIsShouldHaveHeight() ? `${wrapper.scrollHeight}px` : '0px';
		}
	};

	$effect(() => {
		const wrapper = getWrapper();
		const shouldHaveHeight = getIsShouldHaveHeight();
		if (!wrapper) return;
		if (shouldHaveHeight) opened = true;
		if (!opened) return;
		untrack(createCollapse);
	});

	$effect(() => {
		window.addEventListener('resize', createCollapse);
		return () => {
			window.removeEventListener('resize', createCollapse);
		};
	});
}

/** `useNotificationsStack()`: `useContext(NotificationsStackContext)` (call during component init). */
export const useNotificationsStack = (): NotificationsStack => getNotificationsStack();

/**
 * `useNotificationsButtons()`: `buttonsRef` (a callback ref in React, an action here) measures the height of the buttons box
 * without paddings / borders and stores it in `buttonsHeight`.
 */
export function useNotificationsButtons() {
	let buttonsHeight = $state(0);

	const buttonsRef: Action<HTMLElement> = (node) => {
		const cs = getComputedStyle(node);
		const paddingY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
		const borderY = parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth);
		// Высота кнопок без отступов
		const elementHeight = node.offsetHeight - paddingY - borderY;
		if (!Number.isNaN(elementHeight)) {
			buttonsHeight = elementHeight;
		}
	};

	return {
		get buttonsHeight() {
			return buttonsHeight;
		},
		buttonsRef
	};
}
