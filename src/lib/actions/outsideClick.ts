// Port of packages/ui-kit/src/hooks/useOutsideClick.ts
//
// React: useOutsideClick(ref | ref[], (target, event) => void) adds a *capturing* `click` listener on `document` and calls
// the callback when the click target is outside of the ref (or outside of ALL refs of the array).
//
// USAGE (action, the node is the "inside" area)
//   <div use:outsideClick={{ callback: (target, e) => (open = false) }}>...</div>
//   <div use:outsideClick={{ callback: close, ignore: [triggerEl] }}>...</div>     // clicks inside `triggerEl` are "inside" too
//   <div use:outsideClick={close}>...</div>                                        // shorthand for { callback: close }
//   `ignore` may also be a getter: ignore: () => [triggerEl, otherEl]; `enabled: false` pauses the listener.
//
// USAGE (several refs, like React's array form; call during component init)  -> hooks/useOutsideClick.ts
//   useOutsideClick(() => [rootEl, menuEl], (target, e) => { if (open) onClose(); });
//
// Timing is the same as React: the listener lives on `document` in the capture phase, so a click that *opens* something
// (handled at the target/bubble phase, elements mounted after the capture phase) is not reported as an outside click.
import type { Action } from 'svelte/action';

export type OutsideClickCallback = (target: EventTarget | null, event: MouseEvent) => void;
type MaybeElement = Element | null | undefined;
export type OutsideClickRefs = MaybeElement[] | (() => MaybeElement[]);

export interface OutsideClickParams {
	callback: OutsideClickCallback;
	/** Extra elements that count as "inside". */
	ignore?: OutsideClickRefs;
	/** Set to false to pause (default true). */
	enabled?: boolean;
}

const resolve = (refs: OutsideClickRefs | undefined): MaybeElement[] => (typeof refs === 'function' ? refs() : (refs ?? []));

/** Non-action core: is `target` outside of all the given elements? (React array form: `!refs.some(r => r.current && r.current.contains(target))`) */
export function isOutside(target: EventTarget | null, refs: MaybeElement[]): boolean {
	return !refs.some((el) => el && el.contains(target as Node | null));
}

export const outsideClick: Action<HTMLElement, OutsideClickParams | OutsideClickCallback> = (node, initial) => {
	let params: OutsideClickParams = typeof initial === 'function' ? { callback: initial } : initial;

	const handle = (e: MouseEvent) => {
		if (params.enabled === false) return;
		if (isOutside(e.target, [node, ...resolve(params.ignore)])) params.callback(e.target, e);
	};
	document.addEventListener('click', handle, true);

	return {
		update(next) {
			params = typeof next === 'function' ? { callback: next } : next;
		},
		destroy() {
			document.removeEventListener('click', handle, true);
		}
	};
};
