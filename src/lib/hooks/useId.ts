// Port of packages/ui-kit/src/hooks/useId.ts
//
// React: `React.useId` when available, else a counter based polyfill returning `:<n in base 32>:`.
// Svelte: call `useId()` once per component instance (it is just a counter, so call it at the top level of the component
// script, not in a loop / template). Svelte >= 5.20 also has the built-in `$props.id()` which does the same job;
// use either one, only uniqueness of the resulting id matters (the compare harness normalises ids).
//
// USAGE
//   const id = useId();                       // ':0:'
//   <label for={id}>...</label><input {id} />

let count = 0;

/** Unique id (`:0:`, `:1:`, ... base 32). Mirrors the polyfill of the React version. */
export const useId = (): string => `:${(count++).toString(32)}:`;
