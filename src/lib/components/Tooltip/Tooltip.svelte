<script lang="ts" module>
	// Shared between all tooltips (React: module-level `hystersisOpen`): true while some tooltip is open / just was, so the next
	// one opens with `enterNextDelay` instead of `enterDelay`.
	let hystersisOpen = false;
	let isLegacySizeWarningShown = false;
</script>

<script lang="ts">
	// Port of packages/ui-kit/src/components/Tooltip/Tooltip.tsx
	//
	//   <Tooltip title="Заголовок" subtitle="Текст" trigger="hover" placement="top"><Icon/></Tooltip>
	//
	// * DOM: <div class="atmr-tooltip__root"> <div class="atmr-tooltip__trigger" aria-hidden>{children}</div> </div>
	//   + the tooltip element (`div.atmr-tooltip[role=tooltip]`, always in the DOM, portalled to <body> when `useInPortal`).
	// * Visibility is CSS-driven: react-transition-group's `CSSTransition` (classNames "atmr-tooltip", no unmount) is reproduced
	//   below (`-enter`, `-enter-active`, `-enter-done`, `-exit`, `-exit-active`, `-exit-done` on the node; timeouts
	//   { enter: hystersisOpen ? enterNextDelay : enterDelay, exit: leaveDelay + 2000 }), and `transition-delay` is set inline.
	// * Controlled (`isOpened` given) / uncontrolled.
	import clsx from 'clsx';
	import type { Action } from 'svelte/action';
	import type { HTMLAttributes } from 'svelte/elements';
	import { onDestroy, untrack } from 'svelte';
	import Slot from '../../internal/Slot.svelte';
	import type { Content } from '../../internal/types.js';
	import CloseButton from '../Button/CloseButton/CloseButton.svelte';
	import { portal } from '../../actions/portal.js';
	import { usePopper, type UsePopperOptions } from '../../hooks/usePopper.svelte.js';
	import type { PlacementsType } from '../../hooks/usePopper/constants.js';
	import { useOutsideClick } from '../../hooks/useOutsideClick.js';
	import { useValueCssVariable } from '../../hooks/useValueCssVariable.svelte.js';
	import { useFilterAttrs } from '../../hooks/useFilterAttrs.js';
	import { styleToString, type StyleValue } from '../../utils/style.js';
	import { useMotion, type MotionProp } from '../../ext/motion.svelte.js';
	import { originFromPlacement, useShowMotion } from '../../ext/showMotion.svelte.js';
	import {
		ADDITIONAL_OFFSET,
		DEFAULT_PLACEMENT,
		DEFAULT_SIZE,
		DEFAULT_TRIGGER,
		DEFAULT_VARIANT,
		TOOLTIP_SIZES,
		TOOLTIP_VARIANTS,
		TRIGGERS,
		type TooltipSize,
		type TooltipTrigger,
		type TooltipVariant
	} from './constants.js';

	export interface TooltipProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'title' | 'style'> {
		/** Задает заголовок */
		title?: Content;
		/** Задает подзаголовок */
		subtitle?: Content;
		/** Задаёт вариант для компонента */
		variant?: TooltipVariant;
		/** Задаёт размер */
		size?: TooltipSize;
		/** Задает отображение кнопки "Закрыть" */
		closeButton?: boolean;
		/** Задает событие триггер для отображения */
		trigger?: TooltipTrigger;
		/** Задаёт расположение относительно родительского компонента */
		placement?: PlacementsType;
		/** Задает отображение поинтера (стрелки) */
		pointer?: boolean;
		/** Задаёт вариант использования с Portal */
		useInPortal?: boolean;
		/** Задаёт задержку перед появлением компонента при наведении */
		enterDelay?: number;
		/** Задаёт задержку перед появлением компонента при повторном наведении */
		enterNextDelay?: number;
		/** Задаёт задержку на исчезновение компонента */
		leaveDelay?: number;
		/** Callback-функция, вызываемая при появлении тултипа */
		onOpen?: (e: Event) => void;
		/** Callback-функция, вызываемая при закрытии тултипа */
		onClose?: (e: Event) => void;
		/** Задаёт смещение относительно родительского компонента по основной оси */
		offset?: number;
		/** Задаёт смещение относительно родительского компонента по поперечной оси (не применяется при placement up, down, right, left) */
		offsetCounterAxis?: number;
		/** Задаёт отступ для поинтера (стрелки) от края всплывающего элемента */
		pointerOffset?: number;
		/** Элемент, от которого будет позиционироваться всплывающий компонент */
		children?: Content;
		/** Поинтер (стрелка) всегда указывает в центр родительского компонента */
		pointerIsCentered?: boolean;
		/** Автоматически подстраивает ширину компонента под контент */
		autoWidth?: boolean;
		/** Задаёт параметры для popper.js */
		usePopperProps?: UsePopperOptions;
		/** Задает дополнительные классы для tooltip */
		tooltipClassName?: string;
		/** Открывает (показывает) компонент. Если параметр передан, компонент работает в контролируемом режиме */
		isOpened?: boolean;
		/** Задает внутренний компонент */
		innerChildren?: Content;
		/** Задаёт дополнительные стили корневого элемента */
		style?: StyleValue;
		/**
		 * [ext, not in original] Svelte-анимация появления / исчезновения (scale + fade из `transform-origin` по placement, Tween);
		 * задержки `enterDelay` / `leaveDelay` сохраняются. `undefined` — наследуется от `ExtMotionProvider` (без него выключено = оригинал),
		 * `false` — выключено, `true` / `{ duration, easing }` — включено.
		 */
		motion?: MotionProp;
	}

	let {
		title,
		subtitle,
		variant = DEFAULT_VARIANT,
		size: sizeProp = DEFAULT_SIZE,
		closeButton = true,
		trigger = DEFAULT_TRIGGER,
		placement = DEFAULT_PLACEMENT,
		pointer = true,
		useInPortal = true,
		enterDelay = 150,
		enterNextDelay = 0,
		leaveDelay = 200,
		onOpen,
		onClose,
		offset,
		offsetCounterAxis: offsetCounterAxisProp,
		pointerOffset: pointerOffsetProp,
		children,
		pointerIsCentered = true,
		autoWidth = true,
		usePopperProps,
		tooltipClassName: tooltipClasses,
		isOpened: controlledOpen,
		innerChildren,
		motion,
		...restProps
	}: TooltipProps = $props();

	let tooltipEl = $state<HTMLDivElement | null>(null);
	let rootEl = $state<HTMLDivElement | null>(null);
	let triggerEl = $state<HTMLDivElement | null>(null);

	const filtered = $derived(useFilterAttrs(restProps));
	const rootAttrs = $derived(filtered[0]);
	const restAttrs = $derived(filtered[1]);

	let uncontrolledOpen = $state(false);
	const open = $derived(controlledOpen !== undefined ? controlledOpen : uncontrolledOpen);
	let shown = $state(false);

	const disabled = $derived(!title && !subtitle && !innerChildren);
	const isCloseButtonVisible = $derived(closeButton && trigger === TRIGGERS.click);

	const isLegacyMediumSize = $derived(sizeProp === 'm');
	const size = $derived(isLegacyMediumSize ? TOOLTIP_SIZES.s : sizeProp);
	$effect(() => {
		if (isLegacyMediumSize && !isLegacySizeWarningShown) {
			isLegacySizeWarningShown = true;
			console.warn('[Tooltip] Размер "m" убран в соответствии с дизайном. Используйте size="s".');
		}
	});

	const css = useValueCssVariable(
		() => [`--atmr-tooltip-${size}-pointer-offset`, `--atmr-tooltip-${size}-pointer-height`, `--atmr-tooltip-${size}-pointer-width`],
		() => rootEl
	);
	const cssPointerOffset = $derived(css.values[0]);
	const cssPointerHeight = $derived(css.values[1]);
	const cssPointerWidth = $derived(css.values[2]);

	// React: useEffect(() => setShown(!!tooltipRef.current && open), [open])
	$effect(() => {
		const value = !!(tooltipEl && open);
		untrack(() => {
			shown = value;
		});
	});

	const pp = usePopper(() => ({
		enabled: shown,
		placement,
		eventListeners: open,
		pointerOffset: pointerOffsetProp ?? parseFloat(cssPointerOffset) + parseFloat(cssPointerWidth),
		offset: offset ?? parseFloat(cssPointerHeight) + ADDITIONAL_OFFSET,
		offsetCounterAxis: offsetCounterAxisProp ?? parseFloat(cssPointerOffset),
		pointerIsCentered,
		widthFitContent: true,
		...usePopperProps
	}));

	// [ext, not in original] Svelte-native appearance motion; `m.enabled` is false by default, then none of this does anything.
	const m = useMotion(() => motion, 'tooltip');
	const showMotion = useShowMotion({
		m,
		node: () => tooltipEl,
		prop: () => motion,
		scale: 0.95,
		origin: () => originFromPlacement(pp.placement),
		suppressCssTransitions: false // the element's own `visibility` transition carries enterDelay / leaveDelay
	});

	// React's handlers close over the `open` of the last render (they still see the old value while an event is being handled,
	// e.g. `uncontrolledOpen = false; onClose && open` in the outside-click handler). A Svelte `$derived` is always fresh, so keep
	// the value as of the last update (assigned before the DOM update of every flush, like a render).
	let openAtRender = false;
	$effect.pre(() => {
		openAtRender = open;
	});

	function handleOpen(event: Event) {
		if (disabled) return;
		if (controlledOpen === undefined) uncontrolledOpen = true;
		if (onOpen && !openAtRender) onOpen(event);
	}
	function handleClose(event: Event) {
		if (controlledOpen === undefined) uncontrolledOpen = false;
		if (onClose && openAtRender) onClose(event);
	}
	const handleEnter = (event: Event) => handleOpen(event);
	const handleLeave = (event: Event) => handleClose(event);

	// Hover handlers of the trigger and of the tooltip. In React the tooltip is a (portalled) child of the root, so a pointer move
	// between the trigger and the tooltip dispatches `onMouseLeave` (source) and `onMouseEnter` (target) from ONE native event, in
	// the same batch (open stays true, `onClose` fires, `onOpen` does not). Native `mouseleave` / `mouseenter` are separate events,
	// so the pair is handled here, in the `mouseleave` of the source, and the `mouseenter` of the target is skipped.
	// React also renders the updates of `mouseover` / `mouseout` (continuous events) in a LATER task, i.e. after the rest of the
	// pointer event (e.g. `mousemove`) was dispatched to the still visible element; a Svelte flush is a microtask, so the hover
	// handlers run in the next task to keep that order.
	const pendingHover = new Set<ReturnType<typeof setTimeout>>();
	const inNextTask = (fn: () => void) => {
		const id = setTimeout(() => {
			pendingHover.delete(id);
			fn();
		}, 0);
		pendingHover.add(id);
	};
	onDestroy(() => pendingHover.forEach((id) => clearTimeout(id)));

	const isInside = (el: Element | null, target: EventTarget | null) => !!el && target instanceof Node && el.contains(target);
	const isHover = () => trigger === TRIGGERS.hover;
	const onTriggerEnter = (e: MouseEvent) => {
		if (isHover() && !isInside(tooltipEl, e.relatedTarget)) inNextTask(() => handleEnter(e));
	};
	const onTriggerLeave = (e: MouseEvent) => {
		if (!isHover()) return;
		const toTooltip = isInside(tooltipEl, e.relatedTarget);
		inNextTask(() => {
			handleLeave(e);
			if (toTooltip) handleEnter(e);
		});
	};
	const onTooltipEnter = (e: MouseEvent) => {
		if (isHover() && !isInside(triggerEl, e.relatedTarget)) inNextTask(() => handleEnter(e));
	};
	const onTooltipLeave = (e: MouseEvent) => {
		if (!isHover()) return;
		const toTrigger = isInside(triggerEl, e.relatedTarget);
		inNextTask(() => {
			handleLeave(e);
			if (toTrigger) handleEnter(e);
		});
	};

	useOutsideClick(
		() => tooltipEl,
		(target, event) => {
			if (trigger === TRIGGERS.click && triggerEl && !triggerEl.contains(target as Node | null)) {
				uncontrolledOpen = false;
				handleLeave(event);
			}
		}
	);

	$effect(() => {
		const onWindow = (e: Event) => handleClose(e);
		window.addEventListener('scroll', onWindow);
		window.addEventListener('resize', onWindow);
		return () => {
			window.removeEventListener('scroll', onWindow);
			window.removeEventListener('resize', onWindow);
		};
	});

	// ── react-transition-group `CSSTransition` (nodeRef = tooltip, in = open, classNames = "atmr-tooltip", no unmount) ──────────
	const CLASS_NAMES = 'atmr-tooltip';
	type Status = 'exited' | 'entering' | 'entered' | 'exiting';
	let status: Status = untrack(() => (open ? 'entered' : 'exited')); // like Transition: `in` at mount w/o `appear` -> entered, no classes
	let timer: ReturnType<typeof setTimeout> | null = null;

	const addClass = (node: HTMLElement, type: 'enter' | 'exit', phase: 'base' | 'active' | 'done') => {
		const cls = phase === 'base' ? `${CLASS_NAMES}-${type}` : `${CLASS_NAMES}-${type}-${phase}`;
		if (phase === 'active') void node.scrollTop; // force reflow, like CSSTransition
		node.classList.add(cls);
	};
	const removeClasses = (node: HTMLElement, type: 'enter' | 'exit') => {
		node.classList.remove(`${CLASS_NAMES}-${type}`, `${CLASS_NAMES}-${type}-active`, `${CLASS_NAMES}-${type}-done`);
	};
	const cancelTimer = () => {
		if (timer !== null) {
			clearTimeout(timer);
			timer = null;
		}
	};

	function performEnter(node: HTMLElement) {
		const timeout = hystersisOpen ? enterNextDelay : enterDelay;
		// [ext] with motion on the `visibility` transition must carry the delay from the very first style recalculation (the motion hook forces one),
		// otherwise the fade would start while the tooltip is still `visibility: hidden` (the effect below keeps the value in sync afterwards)
		if (showMotion.durationIn() > 0) node.style.transitionDelay = `${timeout}ms`;
		// onEnter
		removeClasses(node, 'exit');
		addClass(node, 'enter', 'base');
		showMotion.enter({ delay: timeout }); // [ext] no-op unless motion is on
		status = 'entering';
		// onEntering
		addClass(node, 'enter', 'active');
		hystersisOpen = true;
		timer = setTimeout(() => {
			timer = null;
			status = 'entered';
			// onEntered
			removeClasses(node, 'enter');
			addClass(node, 'enter', 'done');
		}, timeout);
	}

	function performExit(node: HTMLElement) {
		const timeout = leaveDelay + 2000;
		// [ext] `visibility` must stay until the exit animation is over: same as in performEnter
		if (showMotion.durationOut() > 0) node.style.transitionDelay = `${leaveDelay + showMotion.durationOut()}ms`;
		// onExit
		removeClasses(node, 'enter');
		addClass(node, 'exit', 'base');
		showMotion.exit({ delay: leaveDelay }); // [ext] no-op unless motion is on
		status = 'exiting';
		// onExiting
		addClass(node, 'exit', 'active');
		timer = setTimeout(() => {
			timer = null;
			status = 'exited';
			// onExited
			hystersisOpen = false;
			removeClasses(node, 'exit');
			addClass(node, 'exit', 'done');
		}, timeout);
	}

	$effect(() => {
		const isIn = open;
		const node = tooltipEl;
		if (!node) return;
		untrack(() => {
			if (isIn) {
				if (status !== 'entering' && status !== 'entered') {
					cancelTimer();
					performEnter(node);
				}
			} else if (status === 'entering' || status === 'entered') {
				cancelTimer();
				performExit(node);
			}
		});
	});
	onDestroy(cancelTimer);

	// React: style={{ transitionDelay: open ? `${hystersisOpen ? enterNextDelay : enterDelay}ms` : `${leaveDelay}ms` }}
	// (set as a single property: Popper owns the rest of the element's inline style)
	$effect(() => {
		const el = tooltipEl;
		void shown; // React re-renders after setShown as well, and reads `hystersisOpen` again
		// [ext] while the exit animation runs `visibility` must stay until it has finished (0 extra ms unless motion is on)
		const delay = open ? (hystersisOpen ? enterNextDelay : enterDelay) : leaveDelay + (showMotion.exiting ? showMotion.durationOut() : 0);
		if (el) el.style.transitionDelay = `${delay}ms`;
	});

	const rootClass = $derived(clsx('atmr-tooltip__root', rootAttrs.class));
	const rootStyle = $derived(styleToString(rootAttrs.style));
	const tooltipClass = $derived(
		clsx('atmr-tooltip', `atmr-tooltip--${TOOLTIP_VARIANTS[variant]}`, `atmr-tooltip--size-${TOOLTIP_SIZES[size as 's']}`, autoWidth && 'atmr-tooltip--auto-width', tooltipClasses && tooltipClasses)
	);

	// The `<div>` that ToastNotificationsProvider portals into <body> (holds `.atmr-toast-notification-container`), if present.
	// React's provider appends it in a passive effect, i.e. AFTER every `createPortal` made while rendering (like this one), so the
	// tooltip has to precede it in <body>. The playground mounts that host before the story renders: insert in front of it.
	const findToastHost = (): Element | null => {
		for (const child of Array.from(document.body.children)) {
			if (child.querySelector(':scope > .atmr-toast-notification-container')) return child;
		}
		return null;
	};
	const mountPortal = (node: HTMLElement) => {
		const res = portal(node, undefined); // appends to <body> (no theme wrapper: plain react-dom portal, unlike usePopper's)
		const host = findToastHost();
		if (host && node.parentNode === document.body && host !== node) document.body.insertBefore(node, host);
		return res;
	};

	// React `createPortal(renderTooltip, document.body)` when `useInPortal`
	const inPortal: Action<HTMLElement, boolean> = (node, enabled) => {
		const parent = node.parentNode;
		const next = node.nextSibling;
		let res: { destroy?: () => void } | void = enabled ? mountPortal(node) : undefined;
		return {
			update(nextEnabled) {
				if (nextEnabled && !res) {
					res = mountPortal(node);
				} else if (!nextEnabled && res) {
					res.destroy?.();
					res = undefined;
					parent?.insertBefore(node, next && next.parentNode === parent ? next : null);
				}
			},
			destroy() {
				res?.destroy?.();
			}
		};
	};
</script>

<div {...rootAttrs} class={rootClass} style={rootStyle} bind:this={rootEl}>
	<!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
	<div
		aria-hidden="true"
		class="atmr-tooltip__trigger"
		bind:this={triggerEl}
		use:pp.trigger
		onclick={(e) => trigger === TRIGGERS.click && handleOpen(e)}
		onmouseenter={onTriggerEnter}
		onmouseleave={onTriggerLeave}
	>
		<Slot content={children} />
	</div>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		role="tooltip"
		class={tooltipClass}
		bind:this={tooltipEl}
		use:pp.popper
		use:inPortal={useInPortal}
		onmouseenter={onTooltipEnter}
		onmouseleave={onTooltipLeave}
		{...restAttrs}
	>
		<div class="atmr-tooltip__content_wrapper">
			{#if innerChildren}
				<Slot content={innerChildren} />
			{:else}
				{#if title}<div class="atmr-tooltip__title"><Slot content={title} /></div>{/if}
				{#if subtitle}<div class="atmr-tooltip__subtitle"><Slot content={subtitle} /></div>{/if}
			{/if}
		</div>
		{#if isCloseButtonVisible}
			<CloseButton
				size="2xs"
				onclick={(e) => {
					uncontrolledOpen = false;
					handleLeave(e);
				}}
			/>
		{/if}
		{#if pointer}
			<div class="atmr-tooltip__pointer_wrapper" use:pp.arrow><div class="atmr-tooltip__pointer" use:pp.arrowInner></div></div>
		{/if}
	</div>
</div>
