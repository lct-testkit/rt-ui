/** EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. */
// Convenience entry of the author's extension layer (the generated src/lib/index.ts does not include it):
//
//   import { ExtMotionProvider, Progress, useMotion, rtSlide } from '$lib/ext';
//
// See ./README.md.
//
// Importing this entry (or just `ExtMotionProvider`) also loads the motion-only styles (`ext.css`); the original components never import them.
import './ext.css';
export { default as ExtMotionProvider } from './ExtMotionProvider.svelte';
export { default as Progress } from './Progress/Progress.svelte';
export type { ProgressColorScheme, ProgressProps, ProgressSize, ProgressVariant } from './Progress/Progress.svelte';
export * from './motion.svelte.js';
export * from './transitions.js';
export * from './toastMotion.js';
export * from './showMotion.svelte.js';
export * from './driver.svelte.js';
export * from './collapseMotion.svelte.js';
export * from './indicatorMotion.svelte.js';
export * from './sideMenuMotion.svelte.js';
export * from './calendarMotion.svelte.js';
export * from './tableMotion.svelte.js';
export { default as TableCards } from './TableCards.svelte';
export * from './responsive.svelte.js';
