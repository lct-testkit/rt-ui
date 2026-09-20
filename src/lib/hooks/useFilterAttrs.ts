// Port of packages/ui-kit/src/hooks/useFilterAttrs.ts
//
// React components split their `restProps` in two: "root attrs" (className, style, id, data-*) go on the outermost element,
// everything else (event handlers, aria-*, input attributes ...) goes on the inner element (input / button / ...).
//
// Svelte difference: `className` is `class` here.
//
// USAGE
//   let { label, ...rest } = $props();
//   const [rootAttrs, restAttrs] = $derived(useFilterAttrs(rest));       // re-evaluated when the rest props change
//   <div {...rootAttrs} class={clsx('atmr-input', rootAttrs.class)}> <input {...restAttrs} /> </div>
//
// (it is a plain function, not a real hook: it can be used anywhere, also inside `$derived`)

export type AttrPath = string | RegExp;
type AnyRecord = Record<string, any>;

/** Split `obj` into `[picked, rest]`: keys matching one of `paths` (string equality or RegExp test) and not listed in `exclude` are "picked". */
export function pickWithRest<T extends AnyRecord>(obj: T, paths: AttrPath[], exclude?: string[]): [AnyRecord, AnyRecord] {
	const found: AnyRecord = Object.create(null);
	const rest: AnyRecord = Object.create(null);
	for (const key in obj) {
		if (paths.some((path) => (path instanceof RegExp ? path.test(key) : path === key)) && !exclude?.some((path) => path === key)) {
			found[key] = obj[key];
		} else {
			rest[key] = obj[key];
		}
	}
	return [found, rest];
}

/** Attribute names that belong to the root element of a component. */
export const ROOT_ATTRS: AttrPath[] = ['class', 'style', 'id', /^data-/];

/** `[rootAttrs, restAttrs]` = `pickWithRest(attrs, ['class', 'style', 'id', /^data-/])`. */
export const useFilterAttrs = <T extends AnyRecord>(attrs: T): [AnyRecord, AnyRecord] => pickWithRest(attrs, ROOT_ATTRS);
