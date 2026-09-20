// Port of packages/ui-kit/src/hooks/useOutsideClick.ts — the array form of the React hook.
// For the common "node + optional extra elements" case prefer the `outsideClick` action (src/lib/actions/outsideClick.ts).
//
// React: useOutsideClick(ref | ref[], callback(target, event)); a capturing `click` listener on `document`;
//   * single ref:  callback fires when `ref.current` exists and does not contain the target
//   * array of refs: callback fires when NONE of the refs (that are set) contains the target
//
// USAGE (call during component initialisation; refs are getters so that `bind:this` variables are read lazily)
//   let rootEl = $state<HTMLElement>();  let menuEl = $state<HTMLElement>();
//   useOutsideClick(() => [rootEl, menuEl], (target, e) => { if (isOpened) onClose(); });
//   useOutsideClick(() => rootEl, cb)                       // single ref form
import { onMount } from 'svelte';
import { isOutside, type OutsideClickCallback } from '../actions/outsideClick.js';

type MaybeElement = Element | null | undefined;

export function useOutsideClick(refs: () => MaybeElement | MaybeElement[], callback: OutsideClickCallback): void {
	onMount(() => {
		const handle = (e: MouseEvent) => {
			const value = refs();
			if (Array.isArray(value)) {
				if (isOutside(e.target, value)) callback(e.target, e);
				return;
			}
			if (value && !value.contains(e.target as Node | null)) callback(e.target, e);
		};
		document.addEventListener('click', handle, true);
		return () => document.removeEventListener('click', handle, true);
	});
}
