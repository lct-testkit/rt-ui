import type { Snippet } from 'svelte';

/** Svelte counterpart of React's `ReactNode` for props like label / iconPrefix / iconSuffix. */
export type Content = string | number | boolean | null | undefined | Snippet;
