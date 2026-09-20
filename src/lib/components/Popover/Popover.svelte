<script lang="ts">
	// Port of packages/ui-kit/src/components/Popover/Popover.tsx
	//
	//   <Popover title="Title" subtitle="..." {body} {footer} placement="bottomLeft" trigger="click"><span>trigger</span></Popover>
	//
	// * DOM: <div class="atmr-popover__root"> <div class="atmr-popover__trigger" aria-hidden>{children}</div> </div>
	//   + the popover itself (`div.atmr-popover`), portalled to <body> when `useInPortal` (default).
	// * Positioning: usePopper (Popper.js) — `lazy: true` because in React the closed popover has no popper instance yet.
	// * `isOpened` (React state seed + prop sync effect): `open` follows the prop, but it is also changed locally by the trigger,
	//   the close button, outside clicks and (for trigger="hover") mouse leave — exactly like React.
	import clsx from 'clsx';
	import type { Action } from 'svelte/action';
	import type { HTMLAttributes } from 'svelte/elements';
	import { untrack } from 'svelte';
	import Slot from '../../internal/Slot.svelte';
	import type { Content } from '../../internal/types.js';
	import CloseButton from '../Button/CloseButton/CloseButton.svelte';
	import { usePopper, type UsePopperOptions } from '../../hooks/usePopper.svelte.js';
	import type { PlacementsType } from '../../hooks/usePopper/constants.js';
	import { useOutsideClick } from '../../hooks/useOutsideClick.js';
	import { useValueCssVariable } from '../../hooks/useValueCssVariable.svelte.js';
	import { useFilterAttrs } from '../../hooks/useFilterAttrs.js';
	import { noop } from '../../utils/noop.js';
	import { styleToString, type StyleValue } from '../../utils/style.js';
	import { useMotion, type MotionProp } from '../../ext/motion.svelte.js';
	import { originFromPlacement, useShowMotion } from '../../ext/showMotion.svelte.js';
	import {
		ADDITIONAL_OFFSET,
		DEFAULT_PLACEMENT,
		DEFAULT_SIZE,
		DEFAULT_TRIGGER,
		DEFAULT_VARIANT,
		POPOVER_SIZES,
		POPOVER_VARIANTS,
		TRIGGERS,
		type PopoverSize,
		type PopoverTrigger,
		type PopoverVariant
	} from './constants.js';

	export interface PopoverProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'title' | 'style'> {
		/** Задаёт расположение относительно родительского компонента */
		placement?: PlacementsType;
		/** Задает внутренний компонент */
		innerChildren?: Content;
		/** Задаёт заголовок */
		title?: Content;
		/** Задаёт подзаголовок */
		subtitle?: Content;
		/** Задаёт контент body-части */
		body?: Content;
		/** Задаёт контент footer-части (например, кнопки) */
		footer?: Content;
		/** Задаёт отображение кнопки "Закрыть" */
		showCloseButton?: boolean;
		/** Задаёт вариант для компонента */
		variant?: PopoverVariant;
		/** Задаёт размер */
		size?: PopoverSize;
		/** Открывает (показывает) компонент */
		isOpened?: boolean;
		/** Callback-функция, вызываемая при закрытии */
		onClose?: (e?: Event) => void;
		/** Callback-функция, вызываемая при появлении компонента */
		onOpen?: (e: Event) => void;
		/** Задает отображение поинтера (стрелки) */
		pointer?: boolean;
		/** Устанавливает атрибут disabled */
		disabled?: boolean;
		/** Задает событие триггер для отображения */
		trigger?: PopoverTrigger;
		/** Задаёт вариант использования с Portal */
		useInPortal?: boolean;
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
		/** Задаёт дополнительные классы для popover */
		popoverClassName?: string;
		/** Задаёт параметры для popper.js */
		usePopperProps?: UsePopperOptions;
		/** Задаёт дополнительные стили корневого элемента */
		style?: StyleValue;
		/** Корневой элемент (React `forwardRef`) */
		ref?: HTMLDivElement | null;
		/**
		 * [ext, not in original] Svelte-анимация появления / исчезновения (scale + fade из `transform-origin` по placement, Tween).
		 * `undefined` — наследуется от `ExtMotionProvider` (без него выключено = оригинал), `false` — выключено, `true` / `{ duration, easing }` — включено.
		 */
		motion?: MotionProp;
	}

	let {
		placement = DEFAULT_PLACEMENT,
		innerChildren = null,
		title,
		subtitle,
		body,
		footer,
		showCloseButton = true,
		variant = DEFAULT_VARIANT,
		size = DEFAULT_SIZE,
		isOpened,
		onClose = noop,
		onOpen = noop,
		pointer = true,
		disabled = false,
		trigger = DEFAULT_TRIGGER,
		useInPortal = true,
		offset,
		offsetCounterAxis: offsetCounterAxisProp,
		pointerOffset: pointerOffsetProp,
		children,
		pointerIsCentered = true,
		popoverClassName = '',
		usePopperProps,
		ref = $bindable(null),
		motion,
		...restProps
	}: PopoverProps = $props();

	/** React.Children.count(node) > 0 */
	const hasNode = (node: Content | unknown): boolean => node !== null && node !== undefined;

	let popoverEl = $state<HTMLDivElement | null>(null);
	let triggerEl = $state<HTMLDivElement | null>(null);
	let open = $state(untrack(() => !!isOpened));

	const css = useValueCssVariable(
		() => [`--atmr-popover-${size}-pointer-offset`, `--atmr-popover-${size}-pointer-height`, `--atmr-popover-${size}-pointer-width`],
		() => ref
	);
	const cssPointerOffset = $derived(css.values[0]);
	const cssPointerHeight = $derived(css.values[1]);
	const cssPointerWidth = $derived(css.values[2]);

	const filtered = $derived(useFilterAttrs(restProps));
	const rootAttrs = $derived(filtered[0]);
	const restAttrs = $derived(filtered[1]);

	const bodyContent = $derived(hasNode(body) ? body : innerChildren);
	const hasStructuredContent = $derived(hasNode(title) || hasNode(subtitle) || hasNode(body) || hasNode(footer));
	const hasRenderableContent = $derived(hasStructuredContent || hasNode(innerChildren));
	const hasHeaderContent = $derived(hasNode(title) || hasNode(subtitle));
	const shouldRenderHeader = $derived(hasHeaderContent || showCloseButton);
	const shouldRenderBody = $derived(hasNode(bodyContent));
	const shouldRenderFooter = $derived(hasNode(footer));

	$effect(() => {
		if (trigger === TRIGGERS.hover) {
			console.warn('Popover: trigger="hover" is deprecated and will be removed in a future release.');
		}
	});

	const pp = usePopper(() => ({
		enabled: open,
		placement,
		eventListeners: open,
		pointerOffset: pointerOffsetProp ?? parseFloat(cssPointerOffset) + parseFloat(cssPointerWidth),
		offset: offset ?? parseFloat(cssPointerHeight) + ADDITIONAL_OFFSET,
		offsetCounterAxis: offsetCounterAxisProp ?? (pointerIsCentered ? 0 : parseFloat(cssPointerOffset)),
		pointerIsCentered,
		widthFitContent: true,
		lazy: true,
		...usePopperProps
	}));

	// [ext, not in original] Svelte-native appearance motion; `m.enabled` is false by default, then none of this does anything.
	const m = useMotion(() => motion, 'popover');
	const showMotion = useShowMotion({ m, node: () => popoverEl, prop: () => motion, scale: 0.95, origin: () => originFromPlacement(pp.placement), onExited: () => pp.update() });
	let prevOpen = untrack(() => open);
	$effect.pre(() => {
		const value = open;
		if (value === prevOpen) return;
		prevOpen = value;
		untrack(() => (value ? showMotion.enter() : showMotion.exit()));
	});

	// React: useEffect(() => setOpen(isOpened ? isOpened : false), [isOpened])
	$effect(() => {
		const value = isOpened;
		untrack(() => {
			open = value ? value : false;
		});
	});

	function showPopover(e: Event) {
		if (hasRenderableContent && !disabled && isOpened !== true) {
			open = true;
			onOpen(e);
		}
	}

	function hidePopover(e?: Event) {
		if (!open) return;
		onClose(e);
		open = false;
	}

	useOutsideClick(
		() => popoverEl,
		(target) => {
			if (!triggerEl?.contains(target as Node | null) && open) {
				setTimeout(() => hidePopover(), 0);
			}
		}
	);

	$effect(() => {
		const handleWindowHide = () => hidePopover();
		window.addEventListener('scroll', handleWindowHide);
		window.addEventListener('resize', handleWindowHide);
		return () => {
			window.removeEventListener('scroll', handleWindowHide);
			window.removeEventListener('resize', handleWindowHide);
		};
	});

	const popoverClass = $derived(clsx('atmr-popover', `atmr-popover--${POPOVER_VARIANTS[variant]}`, `atmr-popover--size-${POPOVER_SIZES[size]}`, popoverClassName));
	const rootClass = $derived(clsx('atmr-popover__root', rootAttrs.class));
	const rootStyle = $derived(styleToString(rootAttrs.style));

	// React `createPortal(renderPopover, document.body)` when `useInPortal`, otherwise the popover stays inside the root element
	// React `createPortal(renderPopover, document.body)` when `useInPortal`, otherwise the popover stays inside the root element
	const inPortal: Action<HTMLElement, boolean> = (node, enabled) => {
		const parent = node.parentNode;
		const next = node.nextSibling;
		let res: { destroy?: () => void } | void = enabled ? pp.portal(node) : undefined;
		return {
			update(nextEnabled) {
				if (nextEnabled && !res) {
					res = pp.portal(node);
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

<div {...rootAttrs} class={rootClass} style={rootStyle} bind:this={ref}>
	<!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
	<div
		aria-hidden="true"
		class="atmr-popover__trigger"
		bind:this={triggerEl}
		use:pp.trigger
		onclick={(e) => {
			e.stopPropagation();
			e.preventDefault();
			if (trigger === TRIGGERS.click) showPopover(e);
		}}
		onmouseenter={(e) => trigger === TRIGGERS.hover && showPopover(e)}
		onmouseleave={() => trigger === TRIGGERS.hover && hidePopover()}
	>
		<Slot content={children} />
	</div>
	<div class={popoverClass} data-show={open || showMotion.exiting} bind:this={popoverEl} use:pp.popper use:inPortal={useInPortal} {...restAttrs}>
		{#if hasStructuredContent}
			<div class="atmr-popover__content">
				{#if shouldRenderHeader}
					<div class="atmr-popover__header">
						{#if hasHeaderContent}
							<div class="atmr-popover__header_text">
								{#if hasNode(title)}<div class="atmr-popover__title"><Slot content={title} /></div>{/if}
								{#if hasNode(subtitle)}<div class="atmr-popover__subtitle"><Slot content={subtitle} /></div>{/if}
							</div>
						{/if}
						{#if showCloseButton}<CloseButton class="atmr-popover__close" size="s" onclick={hidePopover} />{/if}
					</div>
				{/if}
				{#if shouldRenderBody}<div class="atmr-popover__body"><Slot content={bodyContent} /></div>{/if}
				{#if shouldRenderFooter}
					<div class="atmr-popover__footer"><div class="atmr-popover__button_group"><Slot content={footer} /></div></div>
				{/if}
			</div>
		{:else}
			<Slot content={innerChildren} />
		{/if}
		{#if pointer}
			<div class="atmr-popover__pointer_wrapper" use:pp.arrow><div class="atmr-popover__pointer" use:pp.arrowInner></div></div>
		{/if}
	</div>
</div>
