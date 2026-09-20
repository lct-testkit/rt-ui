// Ports of packages/ui-kit/src/hooks/*.
//
//  React hook            Svelte
//  ────────────────────  ────────────────────────────────────────────────────────────────────────────────────────
//  useCombinedRefs       NO EQUIVALENT NEEDED. React merged a forwarded `ref` with a local ref. In Svelte use
//                        `bind:this={el}` for the local element and, when a component must hand its element to the
//                        parent, a `ref = $bindable()` prop (`<div bind:this={ref}>`); several consumers of one node
//                        are just `use:` actions / `$effect`s reading the same `el`.
//  useId                 ./useId.ts                       (or the built-in `$props.id()`)
//  useCopyClipboard      ./useCopyClipboard.ts
//  useFilterAttrs        ./useFilterAttrs.ts              (`class` instead of `className`)
//  useOutsideClick       ../actions/outsideClick.ts (action) + ./useOutsideClick.ts (array-of-refs form)
//  useValueCssVariable   ../actions/valueCssVariable.ts (action) + ./useValueCssVariable.svelte.ts (reactive hook)
//  usePopper             ./usePopper.svelte.ts            (+ ./usePopper/constants.ts, popper.modifiers.ts)
//  createPortal          ../actions/portal.ts
export * from './useId.js';
export * from './useCopyClipboard.js';
export * from './useFilterAttrs.js';
export * from './useOutsideClick.js';
export * from './useValueCssVariable.svelte.js';
export * from './usePopper.svelte.js';
export * from './usePopper/constants.js';
export * from './usePopper/popper.modifiers.js';
