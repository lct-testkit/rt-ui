// Port of packages/ui-kit/src/hooks/usePopper/usePopper.tsx (@popperjs/core wrapper used by Popover, Tooltip,
// DropdownMenu, Select, Multiselect, Breadcrumbs, InputDate, TableGrid ...).
//
// The Popper options are EXACTLY the ones of the React hook: `offset`, `arrow` (with the pointer paddings),
// `flip`, `preventOverflow` and the custom `matchWidth` modifier, followed by the caller's own `modifiers`;
// the same placement map (`topLeft` -> `top-start` ...), the same `eventListeners` on/off switching and the same 5 s
// delayed `update()`. Popper applies `style` / `data-popper-*` to the popper element itself (like in React, nothing is
// rendered by the framework), so the DOM is identical.
//
// ─── USAGE ────────────────────────────────────────────────────────────────────────────────────────────────────────
//   <script lang="ts">
//     import { usePopper } from '$lib/hooks/usePopper.svelte.js';
//     import { portal } from '$lib/actions/portal.js';
//     let open = $state(false);
//     let placement = $state<PlacementsType>('bottomLeft');
//
//     // call once, during component initialisation. Pass a GETTER so that reactive values are tracked.
//     const pp = usePopper(() => ({
//       enabled: open,            // React: `enabled: shown`
//       eventListeners: open,     // follow scroll / resize only while open
//       placement,
//       offset: 8,
//       pointerIsCentered: true,
//       widthFitContent: true
//     }));
//   </script>
//
//   <div class="trigger" use:pp.trigger onclick={() => (open = !open)}>...</div>     <!-- trigger BEFORE the popper -->
//   {#if open}
//     <div class="atmr-popover" use:portal={{ themeFrom: () => pp.triggerElement }} use:pp.popper>   <!-- or: use:pp.portal -->
//       content
//       <div class="atmr-popover__pointer_wrapper" use:pp.arrow>
//         <div class="atmr-popover__pointer" use:pp.arrowInner></div>
//       </div>
//     </div>
//   {/if}
//
// Alternatively pass the elements yourself (like React's `trigger: ref.current`): `usePopper(() => ({ trigger: triggerEl,
// popper: popperEl, ... }))` with `let triggerEl = $state<HTMLElement>()` + `bind:this` (option values win over actions).
//
// ─── API ──────────────────────────────────────────────────────────────────────────────────────────────────────────
//  usePopper(options | () => options): UsePopper
//   options (all optional, defaults = React defaults):
//     enabled            false     used together with `eventListeners` (listeners only run while `enabled && eventListeners`)
//     eventListeners     false     update position on scroll / resize
//     placement          'auto'    PlacementsType: auto|top|bottom|left|right|topLeft|topRight|bottomLeft|bottomRight|
//                                  leftTop|leftBottom|rightTop|rightBottom
//     offset             11        distance to the trigger along the main axis (px)
//     offsetCounterAxis  0         shift along the cross axis for the *-start / *-end placements (px)
//     pointerOffset      0         distance of the arrow from the popper edge (px) — read lazily on every update
//     pointerIsCentered  false     arrow always points to the centre of the trigger
//     flip               true      flip to the opposite side when there is no room
//     preventOverflow    true      keep the popper inside `boundary`
//     boundary           'clippingParents'  HTMLElement | 'clippingParents' | 'scrollParent'
//     widthFitContent    false     false = popper gets the width of the trigger (matchWidth modifier), true = content width
//     modifiers          []        extra Popper modifiers, appended after the built-in ones (like in React a new array identity
//                                  re-creates the instance: hoist the array out of the options getter)
//     trigger / popper   -         elements (or a VirtualElement for `trigger`); alternative to the actions below
//     lazy               false     (Svelte-only) create the Popper instance only after `enabled` was true for the first time.
//                                  In React the instance appears once the component re-renders after the refs are set, and
//                                  many closed popups therefore have NO `style` / `data-popper-placement` in their default
//                                  state (Popover, Breadcrumbs dropdown ...). Use `lazy: true` there; keep the default when
//                                  the reference DOM of the closed popup already carries `data-popper-placement`.
//
//   returns
//     trigger      action for the reference element  (`use:pp.trigger`)
//     popper       action for the popper element     (`use:pp.popper`)
//     arrow        action for the arrow wrapper: sets `data-popper-arrow=""` (React `getArrowProps()`)
//     arrowInner   action for the arrow inner: sets `data-popper-arrow-inner=""` (React `getArrowInnerProps()`)
//     portal       `portal` action pre-configured with the theme wrapper of the trigger (React `createPortal()`)
//     update()     Popper `update()` (async, debounced)      forceUpdate()   synchronous update
//     triggerElement / popperElement / instance              current elements / Popper instance (reactive, may be null)
//     placement    actual placement after flipping, e.g. 'top-start' (reactive, null before the first update)
//     positioned   true after the first position was applied (reactive)
//     themeClassName  theme class of the trigger's themed non-body ancestor (what the portal wrapper uses) or null
//
// ─── DIFFERENCES FROM REACT (all deliberate) ─────────────────────────────────────────────────────────────────────
//  * The instance is re-created when the same inputs as in React change (trigger, popper, placement, eventListeners, flip,
//    preventOverflow, boundary, widthFitContent, modifiers, offset, offsetCounterAxis, pointerIsCentered) + when the arrow
//    element appears. Re-creation destroys the previous instance, which (Popper's applyStyles cleanup) resets the popper's
//    inline styles — same as React.
//  * `show()/hide()` (eventListeners on/off) is also applied right after a (re)creation, React skipped it.
//  * The instance is destroyed when trigger or popper disappear (React kept the stale instance until unmount).
//  * The React component-render quirks (refs are `undefined` during the first render, `useTheme` remounting the portal
//    content) do not exist here — see `lazy`.
//  * Not ported: the story `tools-usepopper--use-popper-example` renders NO positioned popper in React (the hook is called
//    with `ref.current` = undefined and the story never re-renders), so a Svelte version of that story must not call
//    usePopper either.
import { untrack } from 'svelte';
import type { Action } from 'svelte/action';
import { createPopper, type Instance, type Modifier, type State, type VirtualElement } from '@popperjs/core';
import { portal, findThemeClassName } from '../actions/portal.js';
import { PLACEMENTS_MAP, type PlacementsType } from './usePopper/constants.js';
import { matchWidth } from './usePopper/popper.modifiers.js';

export type { PlacementsType } from './usePopper/constants.js';

export interface UsePopperOptions {
	/** Включает popper.js для позиционирования */
	enabled?: boolean;
	/** Задаёт смещение относительно родительского компонента по основной оси */
	offset?: number;
	/** Задаёт смещение относительно родительского компонента по поперечной оси (не применяется при placement up, down, right, left) */
	offsetCounterAxis?: number;
	/** Задаёт отступ для поинтера (стрелки) от края всплывающего элемента */
	pointerOffset?: number;
	/** Поинтер (стрелка) всегда указывает в центр родительского компонента */
	pointerIsCentered?: boolean;
	/** Менять положение на противоположное при нехватке места */
	flip?: boolean;
	/** false: ширина popper = ширина trigger; true: ширина по содержимому */
	widthFitContent?: boolean;
	/** Смещаться, чтобы оставаться в зоне видимости */
	preventOverflow?: boolean;
	/** Область для preventOverflow */
	boundary?: HTMLElement | 'clippingParents' | 'scrollParent';
	/** Расположение относительно родительского компонента */
	placement?: PlacementsType;
	/** Обновлять позицию при скролле или ресайзе */
	eventListeners?: boolean;
	/** Модификаторы Popper.js (добавляются после встроенных) */
	modifiers?: Partial<Modifier<any, any>>[];
	/** Родительский компонент (Element | VirtualElement); альтернатива `use:pp.trigger` */
	trigger?: Element | VirtualElement | null;
	/** Всплывающий элемент; альтернатива `use:pp.popper` */
	popper?: HTMLElement | null;
	/** Svelte-only: создавать инстанс Popper только после первого `enabled: true` (см. заголовок файла) */
	lazy?: boolean;
}

export interface UsePopper {
	trigger: Action<Element>;
	popper: Action<HTMLElement>;
	arrow: Action<HTMLElement>;
	arrowInner: Action<HTMLElement>;
	portal: Action<HTMLElement>;
	update: () => Promise<Partial<State> | null>;
	forceUpdate: () => void;
	readonly triggerElement: Element | VirtualElement | null;
	readonly popperElement: HTMLElement | null;
	readonly arrowElement: HTMLElement | null;
	readonly instance: Instance | null;
	readonly placement: string | null;
	readonly positioned: boolean;
	readonly themeClassName: string | null;
}

export function usePopper(options: UsePopperOptions | (() => UsePopperOptions) = {}): UsePopper {
	const read = (): UsePopperOptions => (typeof options === 'function' ? options() : options);
	/** latest options without subscribing the caller (used inside Popper callbacks) */
	const current = (): UsePopperOptions => untrack(read);

	const o = $derived(read());
	// one derived per option that is an effect dependency, so unrelated changes do not re-create the instance
	const enabled = $derived(o.enabled ?? false);
	const eventListeners = $derived(o.eventListeners ?? false);
	const placement = $derived(o.placement ?? 'auto');
	const flip = $derived(o.flip ?? true);
	const preventOverflow = $derived(o.preventOverflow ?? true);
	const boundary = $derived(o.boundary ?? 'clippingParents');
	const widthFitContent = $derived(o.widthFitContent ?? false);
	const modifiers = $derived(o.modifiers);
	const offset = $derived(o.offset ?? 11);
	const offsetCounterAxis = $derived(o.offsetCounterAxis ?? 0);
	const pointerIsCentered = $derived(o.pointerIsCentered ?? false);
	const lazy = $derived(o.lazy ?? false);

	let triggerEl = $state.raw<Element | VirtualElement | null>(null);
	let popperEl = $state.raw<HTMLElement | null>(null);
	let arrowEl = $state.raw<HTMLElement | null>(null);
	const triggerNode = $derived(o.trigger ?? triggerEl);
	const popperNode = $derived(o.popper ?? popperEl);

	let instance = $state.raw<Instance | null>(null);
	let actualPlacement = $state<string | null>(null);
	let positioned = $state(false);
	let armed = $state(false);

	const themeClassName = $derived(findThemeClassName(triggerNode as Element | null));

	// `lazy`: remember that the popup has been enabled at least once
	$effect.pre(() => {
		if (enabled) armed = true;
	});

	// ── (re)create the Popper instance (React: the big useEffect) ─────────────────────────────────────────────────
	$effect(() => {
		const trigger = triggerNode;
		const popper = popperNode;
		const arrow = arrowEl;
		const ready = !lazy || armed;
		const pl = placement;
		// dependencies of the React effect, read here only to subscribe to them
		void [eventListeners, flip, preventOverflow, boundary, widthFitContent, modifiers, offset, offsetCounterAxis, pointerIsCentered];
		if (!trigger || !popper || !ready) return;

		const created = untrack(() =>
			createPopper(trigger, popper, {
				placement: PLACEMENTS_MAP[pl],
				modifiers: [
					{
						name: 'offset',
						options: {
							offset: ({ placement: pos }: { placement: string }) => {
								const { offset: mainAxis = 11, offsetCounterAxis: counterAxis = 0 } = current();
								if (pos.includes('top') || pos.includes('bottom')) {
									if (pos.includes('start')) return [-counterAxis, mainAxis];
									if (pos.includes('end')) return [counterAxis, mainAxis];
								}
								if (pos.includes('left') || pos.includes('right')) {
									if (pos.includes('start')) return [-counterAxis, mainAxis];
									if (pos.includes('end')) return [counterAxis, mainAxis];
								}
								if (pos.includes('start')) return [counterAxis, mainAxis];
								if (pos.includes('end')) return [-counterAxis, mainAxis];
								return [0, mainAxis];
							}
						}
					},
					{
						name: 'arrow',
						options: {
							element: arrow ?? undefined,
							padding: ({ popper: pop, placement: pos }: { popper: { width: number; height: number }; placement: string }) => {
								const { offsetCounterAxis: counterAxis = 0, pointerOffset = 0, pointerIsCentered: centered = false } = current();
								if (pos.includes('top') || pos.includes('bottom')) {
									if (pos.includes('start')) {
										if (centered) return { right: counterAxis + 14 };
										return { right: Math.round(pop.width - pointerOffset) + 14 };
									}
									if (pos.includes('end')) {
										if (centered) return { left: 14 };
										return { left: Math.round(pop.width - pointerOffset - counterAxis + 14) };
									}
									return { right: Math.round(pop.width / 2) + 7 };
								}
								if (pos.includes('left') || pos.includes('right')) {
									if (pos.includes('start')) return { bottom: Math.round(pop.height - pointerOffset + counterAxis) };
									if (pos.includes('end')) return { top: Math.round(pop.height - pointerOffset) };
									return { bottom: Math.round(Math.round(pop.height / 2) + 7) };
								}
								return 7;
							}
						}
					},
					{ name: 'flip', enabled: !!flip },
					{ name: 'preventOverflow', enabled: !!preventOverflow, options: { boundary } },
					{ ...matchWidth, enabled: !widthFitContent },
					...(modifiers ?? []),
					// read-only observer feeding the reactive `placement` / `positioned` (does not change the layout)
					{
						name: 'atmrState',
						enabled: true,
						phase: 'afterWrite',
						fn: ({ state }: { state: State }) => {
							actualPlacement = state.placement;
							positioned = true;
						}
					}
				]
			})
		);
		instance = created;
		return () => {
			created.destroy();
			if (instance === created) instance = null;
			actualPlacement = null;
			positioned = false;
		};
	});

	// ── eventListeners on/off (React: show() / hide()) ────────────────────────────────────────────────────────────
	$effect(() => {
		// React runs show()/hide() only when [enabled, eventListeners] change — NOT when the instance is (re)created, so `instance`
		// must not be a dependency (a closed popper created later keeps Popper's default scroll/resize listeners, like in React).
		const inst = untrack(() => instance);
		const active = eventListeners && enabled;
		if (!inst) return;
		untrack(() => {
			try {
				inst.setOptions((opts) => ({
					...opts,
					modifiers: [
						...(opts.modifiers ?? []).filter((m) => m.name !== 'eventListeners'),
						active ? { name: 'eventListeners', enabled: true, options: { scroll: true, resize: true } } : { name: 'eventListeners', enabled: false }
					]
				}));
				inst.update();
			} catch {
				// ignore
			}
		});
	});

	// React: setTimeout(() => instance.update(), 5000) once after mount
	$effect(() => {
		const id = setTimeout(() => instance?.update(), 5000);
		return () => clearTimeout(id);
	});

	// ── actions ───────────────────────────────────────────────────────────────────────────────────────────────────
	const triggerAction: Action<Element> = (node) => {
		triggerEl = node;
		return {
			destroy() {
				if (triggerEl === node) triggerEl = null;
			}
		};
	};
	const popperAction: Action<HTMLElement> = (node) => {
		popperEl = node;
		return {
			destroy() {
				if (popperEl === node) popperEl = null;
			}
		};
	};
	const arrowAction: Action<HTMLElement> = (node) => {
		node.setAttribute('data-popper-arrow', '');
		arrowEl = node;
		return {
			destroy() {
				if (arrowEl === node) arrowEl = null;
			}
		};
	};
	const arrowInnerAction: Action<HTMLElement> = (node) => {
		node.setAttribute('data-popper-arrow-inner', '');
	};
	const portalAction: Action<HTMLElement> = (node) => {
		const res = portal(node, { themeFrom: () => untrack(() => (o.trigger ?? triggerEl) as Element | null) });
		return { destroy: () => res?.destroy?.() };
	};

	return {
		trigger: triggerAction,
		popper: popperAction,
		arrow: arrowAction,
		arrowInner: arrowInnerAction,
		portal: portalAction,
		update: () => untrack(() => instance?.update() ?? Promise.resolve(null)),
		forceUpdate: () => untrack(() => instance?.forceUpdate()),
		get triggerElement() {
			return triggerNode;
		},
		get popperElement() {
			return popperNode;
		},
		get arrowElement() {
			return arrowEl;
		},
		get instance() {
			return instance;
		},
		get placement() {
			return actualPlacement;
		},
		get positioned() {
			return positioned;
		},
		get themeClassName() {
			return themeClassName;
		}
	};
}
