/** EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. */
// Toast notification motion of the author's extension layer (see src/lib/ext/README.md, "Toast").
//
// The ToastNotificationsProvider stack (src/lib/components/wrappers/ToastNotificationsProvider) uses this ONLY when the extension is switched on
// for toasts (`motion` prop of the provider / of a notification, or an ExtMotionProvider with mode 'svelte' / `overrides: { toast: ... }`).
// With it off the stack renders the ORIGINAL markup and class transitions.
//
//   in:      rtFly    from the side the toast is anchored to (topRight -> from the right and the top), + fade   ('m' / expressive-entrance)
//   out:     rtFly    back the way it came + fade                                                             ('s' / expressive-exit)
//   reflow:  animate:rtFlip  when the stack changes, the other toasts glide to their new place                 ('m' / productive-standard)
//
// Durations / easings come from the theme tokens (`--atmr-motion-*`) through transitions.ts; prefers-reduced-motion: reduce makes every one of
// them zero-length.

/** Offset (px) a toast flies in from / out to, by its `position` (`'topLeft' | 'topRight' | 'topCenter' | 'bottomLeft' | 'bottomRight' | 'bottomCenter'`). */
export function toastFlyOffset(position: string | undefined): { x: number; y: number } {
	const p = String(position ?? 'topRight');
	const x = p.endsWith('Left') ? -48 : p.endsWith('Right') ? 48 : 0;
	const y = p.startsWith('bottom') ? 24 : -24;
	return { x, y };
}
