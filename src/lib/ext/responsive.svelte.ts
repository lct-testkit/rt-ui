/** EXTENSION — author's addition, NOT part of the original Rostelecom design system. */
// Reactive breakpoints for adaptive layouts (Svelte 5 `MediaQuery` / `innerWidth` from svelte/reactivity). The original components have no such
// helper: an app decides itself when to swap a table for cards, a side menu for a burger, a modal for a full-screen sheet. This is the common answer.
//
//   const bp = useBreakpoint();
//   {#if bp.isMobile} ...cards... {:else} ...table... {/if}
//
// Breakpoints (px, same as the CSS of the CRM example): mobile < 768 <= tablet < 1024 <= desktop. On the server (SSR) and before the first
// measurement the fallback is "desktop" (all queries false), so server markup is the desktop layout; a client-only app (ssr = false) never sees it.
import { MediaQuery } from 'svelte/reactivity';
import { innerHeight, innerWidth } from 'svelte/reactivity/window';

export const BREAKPOINTS = { mobile: 768, tablet: 1024 } as const;
export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

/** `matches` of a media query, reactive: `useMediaQuery('(prefers-color-scheme: dark)').matches` */
export function useMediaQuery(query: string, fallback = false): { readonly matches: boolean } {
	const mq = new MediaQuery(query, fallback);
	return {
		get matches() {
			return mq.current;
		}
	};
}

export interface BreakpointState {
	/** 'mobile' (< 768 px), 'tablet' (768 - 1023 px) or 'desktop' (>= 1024 px) */
	readonly name: Breakpoint;
	readonly isMobile: boolean;
	readonly isTablet: boolean;
	readonly isDesktop: boolean;
	/** a touch-first device (`(pointer: coarse)`): use larger targets even when the window is wide */
	readonly isTouch: boolean;
	/** window size in px (reactive; 0 on the server) */
	readonly width: number;
	readonly height: number;
}

/** Reactive breakpoint of the window. Call once per component (it only creates three cheap media-query listeners). */
export function useBreakpoint(): BreakpointState {
	const mobile = new MediaQuery(`(max-width: ${BREAKPOINTS.mobile - 1}px)`, false);
	const tablet = new MediaQuery(`(min-width: ${BREAKPOINTS.mobile}px) and (max-width: ${BREAKPOINTS.tablet - 1}px)`, false);
	const coarse = new MediaQuery('(pointer: coarse)', false);
	return {
		get name() {
			return mobile.current ? 'mobile' : tablet.current ? 'tablet' : 'desktop';
		},
		get isMobile() {
			return mobile.current;
		},
		get isTablet() {
			return tablet.current;
		},
		get isDesktop() {
			return !mobile.current && !tablet.current;
		},
		get isTouch() {
			return coarse.current;
		},
		get width() {
			return innerWidth.current ?? 0;
		},
		get height() {
			return innerHeight.current ?? 0;
		}
	};
}
