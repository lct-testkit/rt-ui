# rt-ui — porting guide (read fully before touching code)

We build a **Svelte 5 port of the Rostelecom "Atomaro" design system (gen2)**. The React Storybook is the
single source of truth. Success = for every story, **DOM, element boxes and pixels are identical** to the
reference, in the default state and in every interaction state (`tools/compare.py` checks all three).

## 1. Layout

```
src/lib/components/<Group>/<Name>.svelte   mirrors packages/ui-kit/src/components/<Group>/...
                                            e.g. Button/Button/Button.svelte, Checkbox/CheckboxGroup/CheckboxGroup.svelte
src/lib/hooks | utils | actions | internal shared code (foundation group owns them; add NEW files, do not rewrite others')
src/lib/icons/**                            GENERATED (tools/gen-icons.mjs) — never edit
src/lib/index.ts                            GENERATED (tools/gen-barrel.mjs) — never edit
src/lib/styles/**                           extracted reference CSS — never edit (see §3)
src/stories/<Dir>/<story-id>.svelte         one Svelte file per story id; <Dir> = the React stories dir
src/stories/_utils/                         story helpers (ExamplesDecorator, icon maps ...)
tools/interactions/<story-id|component-prefix>.json   extra interaction states (see §6)
tools/viewports.d/<group>.json              per-story viewport overrides {"<story-id>": [w, h]}
```

Import components by **direct path** (`$lib/components/Button/Button/Button.svelte`, relative paths inside
`src/lib`), never through `src/lib/index.ts` (it is generated and regenerated at the end).

## 2. Sources of truth

| what | where |
|---|---|
| readable (transpiled) React source of every component | `design/react-src/packages/{ui-kit,icons,tablegird,tree,sidemenu}/**` |
| React source of every story (+ `originalSource` = authored CSF) | `design/react-src/stories-app/src/stories/<Dir>/*.stories.tsx`, helpers in `.../src/utils/` |
| storybook global decorator / parameters | `design/react-src/stories-app/.storybook/preview.js` |
| per-story reference data | `design/reference/<story-id>/` → `meta.json` (initialArgs, argTypes with docgen descriptions, `storyFn`, parameters), `<state>.png`, `<state>.dom.json` |
| every stylesheet the reference loads (incl. story-specific CSS) | `design/reference-css/<sha>.css` (list per story in `meta.json → styleSheets`) |
| unit dependency levels | `tools/deps.json` |
| vendor libs used by the React version | `design/react-vendor/` (popper, dayjs, imask, virtua, react-transition-group, ...) |

Reading tips: modules are webpack output. `x.A` = default export of an imported module. Babel helpers
(`_extends`, `_objectWithoutPropertiesLoose`, `_slicedToArray`, `_asyncToGenerator`, `_regenerator`) were stripped
but their calls remain — they mean object spread / rest props / array destructuring / async functions.
`react.createElement(tag, props, ...children)` = JSX. `react.useState/useEffect/useMemo/useRef/useCallback/useContext` = hooks.
`_excluded = [...]` lists props removed from `restProps` (which is then spread onto the root element).

## 3. Styles: DO NOT WRITE COMPONENT CSS

All `atmr-*` component styles, the four themes and the font are already extracted 1:1 into `src/lib/styles`
and loaded globally by the playground (`+layout.svelte`). A Svelte component only has to emit **the same class names
on the same DOM**. Story-only CSS (classes such as `.profile`, `.cities-list`, `.stories-contact-card`) is found in
`design/reference-css/*.css` — copy exactly the needed rules into the story file's `<style>` (use `:global(...)` for
selectors that must not be scoped) — never into `src/lib`.

## 4. Porting rules

1. **Same DOM**: tags, attribute set/values, class list, `id`/`aria-*`/`role`/`tabindex`/`type`/`data-*`, text, child order,
   inline `style` — identical to what React rendered (ids are normalised by first appearance, so any unique id works).
2. **Props = React props** (same names, same defaults, same enums — see `argTypes` in `meta.json`).
   `className` → `class`. Every prop in `argTypes` must be accepted.
3. **Node props** (`label`, `iconPrefix`, `iconSuffix`, `children`, anything typed `ReactNode`) → type `Content`
   (`src/lib/internal/types.ts`), rendered with `<Slot content={x} />`; pure children → `children?: Snippet` + `{@render children?.()}`.
   Function-as-children / render props → snippets with parameters.
4. **Events**: DOM handlers spread on the root (`onClick`, `onKeyDown`... via `restProps`) become Svelte's lowercase
   `onclick`, `onkeydown` via `{...rest}`. Component-specific callbacks (`onChange(value)`, `onSelect`, `onOpen`, ...) keep the
   React name and signature. Storybook "action" args (`onClick: fn()`) have no DOM effect — ignore them in stories.
5. **State**: `useState` → `$state`; `useMemo` → `$derived`; `useEffect` → `$effect` (mind cleanup + deps);
   `useRef` → `let el = $state<HTMLElement>()` + `bind:this`; controlled/uncontrolled (`value` / `defaultValue` / `onChange`) →
   keep the same semantics (`$bindable` where natural). `useContext`/`createContext` → Svelte context (`setContext/getContext`).
6. **Portals** (`createPortal(..., document.body)`) → `use:portal`-style action (foundation provides `src/lib/actions/portal.ts`)
   appending to `document.body` so the extra top-level node appears exactly where React put it.
7. **Popper**: React uses `@popperjs/core` through `usePopper` — use the same lib and options (foundation: `src/lib/hooks/usePopper.svelte.ts`) so
   positions match to the pixel.
8. **react-transition-group** (`CSSTransition`, `Transition`): reproduce the same class sequence (`-enter`, `-enter-active`,
   `-enter-done`, ...) and timeouts. The harness freezes animation *after* the page settled (~450 ms), so the **end state** must match.
9. **Virtualisation** (`virtua`, `react-virtualized`) → `virtua/svelte` / same window sizes so visible rows are identical.
10. `id` defaults: React `useId` → `$props.id()` or a counter; only uniqueness matters.
11. TypeScript (`lang="ts"`), strict; export prop types from the component (`export interface XProps`) when useful.
12. Keep React file structure names (constants, context) as `constants.ts`, `context.ts` next to the component.
13. **Do not** edit: generated files, `src/lib/styles/**`, `tools/{harness,compare,snapshot,canon,...}` (report harness bugs in your
    final message instead), other groups' files, `design/reference/**` (except via `tools/snapshot.py --ids ... --force`).
    Need something shared that doesn't exist? Create a NEW file in your own area (e.g. `src/lib/components/<Group>/_utils.ts`)
    or, if truly generic, a new file under `src/lib/utils/` with a group-specific name.

## 5. Stories

One file per story id: `src/stories/<Dir>/<story-id>.svelte`. Port the story's `render`/`args`/`decorators`:

* Storybook renders the story with `initialArgs` (see `meta.json`) — hard-code those values (and computed values such as
  `Object.values(SIZES).map(...)`).
* Decorators from `export default {decorators}` or the story object are part of the DOM (e.g. `examplesDecorator` →
  `src/stories/_utils/ExamplesDecorator.svelte`). The global decorator (`ToastNotificationsProvider position="topRight"`)
  is applied by the playground route, not by you.
* Stateful stories (`useState` in `render`) → `$state` in the story file.
* `parameters.layout` (padded/centered/fullscreen) is applied by the playground from `layout.json` — nothing to do.
* Images used by stories are in `static/story-assets/` (URL `/story-assets/<name>`; e.g. `/story-assets/avatar.png`, `catWithGlasses.svg`,
  `Image_storybook_1..4.png`, `Atomaro_Logo.svg`). The harness compares image URLs by basename (hash stripped). Need another asset? Ask in your report.
* If the story needs a viewport other than 1280×800, add `tools/viewports.d/<group>.json` and re-snapshot.

## 6. Test loop (this is how you know you are done)

```bash
node tools/up.mjs                                        # mirror :6006 + playground :5180 (idempotent)
python tools/compare.py --match "^components-badge--" --jobs 3     # regex on story ids; PASS/FAIL + first differences
python tools/compare.py --ids a,b --states default               # subset
```

`compare.py` prints for each state `dom=N box=N px=N`: DOM diffs (path, ref vs ours), element boxes that moved > 0.6 px,
differing pixels. Images: reference `design/reference/<id>/<state>.png`, yours `design/diff/<id>/<state>.ours.png`,
red overlay `design/diff/<id>/<state>.diff.png` — **look at them** with the Read tool.

States: `default` + automatic `tab1` (press Tab), `hover1` / `click1` (first visible interactive element in `#storybook-root`).
Automatic states are only a floor. **For every stateful component add interaction states** in
`tools/interactions/<story-id>.json` or `tools/interactions/<component-prefix>.json` (prefix = story id up to `--`,
e.g. `components-select`):

```json
{"states": [
  {"name": "open",   "actions": [["click", "#storybook-root .atmr-select"], ["wait", 300]]},
  {"name": "typed",  "actions": [["click", "#storybook-root input"], ["type", "#storybook-root input", "abc"]]},
  {"name": "kbd",    "actions": [["focus", "#storybook-root [role=combobox]"], ["press", "ArrowDown"], ["press", "Enter"]]}
]}
```
Actions: `hover sel`, `click sel`, `dblclick sel`, `focus sel`, `type sel text`, `fill sel text`, `press Key`, `mouse x y`,
`wait ms`, `scroll sel dx dy`. Selectors are Playwright selectors (`css >> nth=1`, `text=...`). Then
`python tools/snapshot.py --ids <ids> --force` regenerates the **reference** states from the original React app, and `compare.py`
checks yours against them. Cover: open/close of popups, keyboard navigation (Arrow/Enter/Escape/Space/Tab), selection,
checked/indeterminate, disabled, error/hint, clear buttons, hover/active/focus-visible, scrolling lists, tooltip/popover placements,
different themes (`compare.py --theme rtk_purple_dark` on a few stories).

Never "fix" a diff by editing reference data, hiding elements, or special-casing the story. Fix the component so it does what
the React one does. If a diff is caused by the harness (non-determinism, harness bug), say so precisely in your report.

## 7. Definition of done for a story

`compare.py` PASS for all states, the component accepts every prop from `argTypes`, and behaviour that React implements
(keyboard, focus, outside-click, controlled/uncontrolled) is implemented — not only what the screenshots exercise.
`npx svelte-check` must report no errors in your files (filter the output to your paths; other groups' files may be mid-edit).

## 8. Final report (your last message, plain text)

* table: story id → PASS/FAIL (+ one-line reason for FAIL)
* stories you could not do (blocked by a missing dependency component: name it)
* deviations from React behaviour you knowingly left, harness problems, follow-ups
* list of files you created

## 9. Foundation API (hooks, actions, utils, Typography, story helpers)

All of these were written by the foundation group; **import by direct path** (the generated barrel exports `hooks/`, `utils/`, `actions/`
and every `*.svelte` component, but not component-local `constants.ts` files). Every file has a header comment with the details.

### 9.1 Actions (`src/lib/actions/*`, replace React hooks that touch the DOM)

| React | Svelte | usage |
|---|---|---|
| `createPortal(x, document.body)` | `actions/portal.ts` | `use:portal` / `use:portal={{ target?: HTMLElement or selector, themeFrom?: Element or () => Element }}` |
| `useOutsideClick(ref, cb)` | `actions/outsideClick.ts` | `use:outsideClick={{ callback(target, e), ignore?: Element[] or () => Element[], enabled? }}` (or just a callback) |
| `useValueCssVariable(vars, ref)` | `actions/valueCssVariable.ts` | `use:valueCssVariable={{ variables: string[], onChange(values: string[]) }}`; helpers `readCssVariable(s)`, `getThemeElement` |

```svelte
{#if open}
  <div class="atmr-popover" use:portal use:outsideClick={{ callback: () => (open = false), ignore: () => [triggerEl] }}>...</div>
{/if}
```

`use:portal` appends the node to the end of `<body>` when it mounts and removes it on destroy (same top-level DOM position as
`createPortal`). Put it on the ONLY root node of its `{#if}` branch / component (Svelte removes DOM ranges by walking `nextSibling`).
DOM events do not bubble through the logical component tree (React synthetic events did) - attach the handler to the portalled node too.
`themeFrom` re-creates usePopper's `<div class="Theme_root_rtk_*">` wrapper (only when the trigger sits in a themed non-body container).

### 9.2 Hooks (`src/lib/hooks/*`)

| React | Svelte | signature |
|---|---|---|
| `usePopper` | `hooks/usePopper.svelte.ts` | `usePopper(options or () => options)` returns `{ trigger, popper, arrow, arrowInner, portal (actions), update(), forceUpdate(), triggerElement, popperElement, instance, placement, positioned, themeClassName }` |
| `useOutsideClick([refs], cb)` | `hooks/useOutsideClick.ts` | `useOutsideClick(() => [a, b] or () => a, (target, e) => void)` (call at component init) |
| `useValueCssVariable` | `hooks/useValueCssVariable.svelte.ts` | `useValueCssVariable(() => vars, () => el)` returns `{ values: string[] }` (reactive, `'0'` until read) |
| `useId` | `hooks/useId.ts` | `useId()` returns `':0:'` (or use `$props.id()`) |
| `useCopyClipboard` | `hooks/useCopyClipboard.ts` | `useCopyClipboard()` returns `{ copy(text) }`; plain `copyToClipboard(text)` |
| `useFilterAttrs` | `hooks/useFilterAttrs.ts` | `useFilterAttrs(rest)` returns `[rootAttrs, restAttrs]` (`class`, `style`, `id`, `data-*` are "root"); usable inside `$derived` |
| `useCombinedRefs` | - | no equivalent needed: `bind:this`, a `ref = $bindable()` prop, or several actions on one node |
| `usePopper/constants` | `hooks/usePopper/constants.ts` | `PLACEMENTS`, `PLACEMENTS_MAP`, `type PlacementsType`; `hooks/usePopper/popper.modifiers.ts`: `matchWidth` |

```svelte
<script lang="ts">
  const pp = usePopper(() => ({ enabled: open, eventListeners: open, placement, offset: 11, pointerIsCentered: true,
                                widthFitContent: true, lazy: true }));
</script>
<div class="atmr-popover__trigger" use:pp.trigger>...</div>
{#if open}
  <div class="atmr-popover" use:pp.portal use:pp.popper>
    <div class="atmr-popover__pointer_wrapper" use:pp.arrow><div class="atmr-popover__pointer" use:pp.arrowInner></div></div>
  </div>
{/if}
```

Options = the React options with the React defaults (`enabled` false, `offset` 11, `flip`/`preventOverflow` true, `boundary` 'clippingParents',
`placement` 'auto', ...). The Popper modifiers are exactly the React ones; positions, arrow paddings, flip, `matchWidth` and the inline
styles after open and after open->close were verified numerically against the React Popover for all 13 placements (+ offsets,
`pointerIsCentered`, flip / overflow cases). Place the trigger BEFORE the popper in the markup (or pass `trigger` / `popper` elements in
the options, e.g. `bind:this` variables).

`lazy: true` (Svelte-only option) creates the Popper instance only once `enabled` has been true. Use it when the reference DOM of the
CLOSED popup has no `style` / `data-popper-placement` (in React the instance is only created after a later re-render, e.g. closed
Popover); leave it off when the closed popup already carries `data-popper-placement` (e.g. Multiselect, DropdownMenu with `isOpened`).
Like React, the instance is re-created when `eventListeners` / placement / offset / ... change (this resets and re-applies the inline styles).
The story `tools-usepopper--use-popper-example` renders NO positioned popper in React (refs are undefined during the only render): the
Svelte story must not call usePopper either.

### 9.3 Utils (`src/lib/utils/*`)

`function.ts`: `noop`, `preventDefaultFn(e)`. `noop.ts`: re-export of `noop`. `input.ts`: `setCaretPosition(input, pos, end?)`,
`getCaretPosition(input)`, `correctCaretPosition(input)`, `defaultTrasformationRule`, `resolveOnChange(target, event, onChange)`
(native events; for a `click` it passes an event whose `target` / `currentTarget` is a clone of the input with `value = ''`).
`style.ts` (Svelte-only): `styleToString(...styles)` where a style is a CSS string or a React-like object
(`{ width: 300, marginTop: '4px', '--x': 1 }` becomes `width: 300px; margin-top: 4px; --x: 1;`); use it wherever a component merges a
`style` prop (`style?: StyleValue`).

### 9.4 Typography (`src/lib/components/Typography/`)

`<Typography variant="body-m" as="span" strong elipsis elipsisLines={2} class="x" style="..." {...rest}>text</Typography>`.
`variant` = `TYPOGRAPHY_VARIANTS` (`./constants.ts`, default `display-s`), `as` = tag name string (default `p`; React components as `as`
are not supported), `style` = CSS string or React-like object, `children?: Content` (snippet, string or number). Root DOM, classes and
inline style are identical to React (verified for every prop against the React story).

### 9.5 ThemeProvider (`src/lib/components/wrappers/ThemeProvider/`)

`<ThemeProvider theme="rtk_default_dark" class?>...</ThemeProvider>` renders `<div class="Theme_root_rtk_default_dark">`. React has no such
component (a theme is just the class on a root element or on `<body>`); use it for nested "theme in theme" areas.
`themeClassName(theme)` lives in `./constants.ts`.

### 9.6 Story helpers (`src/stories/_utils/`)

* `ExamplesDecorator.svelte` = `examplesDecorator`: `<ExamplesDecorator>{#each ... as v}<Button .../>{/each}</ExamplesDecorator>`
  (`<div style="display:flex;justify-content:center;align-items:end;gap:10px;width:100%">`).
* `DecorateStory.svelte` = `decorateStory`: `<DecorateStory>...</DecorateStory>` (`<div style="width:280px">`).
* `icons.ts`: `ICONS`, `ICONS_SMALL`, `ICONS_DROPDOWN_MENU` (its `true` entry is the boolean true), `ICONS_TREE`, `EXAMPLE_ICONS`,
  `EXAMPLE_ICONS_SMALL`, `EXAMPLE_ICONS_DROPDOWN_MENU`, `EXAMPLE_ICONS_TREE`, `getIcon(name, set)`, `getStoryOptions(options)`.
  The maps hold icon COMPONENTS (React held elements).
* `IconByName.svelte`: `<IconByName name="search" set="icons|small|dropdownMenu|tree" {...iconProps} />`; use it inside snippets:
  `<Button label="x">{#snippet iconPrefix()}<IconByName name={args.iconPrefix} />{/snippet}</Button>`
  (node props such as `iconPrefix?: Content` accept a snippet).
* `iconsClickCopy.ts`: default export `handleClick(text)` (clipboard copy, used by the Icons stories).
* Not ported on purpose: `getStorybookDocsPage*`, `StoryDescription`, `NotificationsStoriesDescription` (Storybook docs pages only,
  never part of a story's DOM).

### 9.7 Dev-server tip

The playground's `import.meta.glob` does not notice NEW story files on this machine: after creating a story run
`touch "src/routes/story/[id]/+page.svelte"` (only bumps the mtime) and wait about 2 s, otherwise the page shows `MISSING STORY`.
