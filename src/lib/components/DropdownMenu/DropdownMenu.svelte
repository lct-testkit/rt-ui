<script lang="ts">
	// Port of packages/ui-kit/src/components/DropdownMenu/DropdownMenu.tsx (+ hooks.tsx `useMenuItems`, constants.ts)
	//
	//   <DropdownMenu {items} {isOpened} placement="bottomLeft" onClickItem={(item) => ...} onClose={() => (isOpened = false)}>
	//     <Button label="open" onclick={() => (isOpened = !isOpened)} />          <- `children`: the trigger, rendered inside the root
	//   </DropdownMenu>
	//
	// DOM (identical to React):
	//   <div class="atmr-dropdown-menu-root [class]" (root attrs: class / style / id / data-*)>        <- popper trigger
	//     {children}
	//     <div class="atmr-dropdown-menu atmr-dropdown-menu--size-m atmr-dropdown-menu--primary ..." data-show data-testid="ddm">  <- popper element, `ref`
	//       <div class="atmr-dropdown-menu__menu" data-testid="ddm__menu">
	//         {headerSlot(hide, items)}
	//         <div class="atmr-dropdown-menu__empty">…</div>  |  <div class="atmr-dropdown-menu__list"><ul role="listbox"><li>{item}</li>…</ul></div>
	//                                                         |  virtual: <div class="atmr-dropdown-menu__list"><VList class="atmr-scroll-bar">{item}…</VList></div>
	//         {footerSlot(hide, items)}
	//   ... and the menu itself is moved to <body> when `useInPortal` (default), like React's `createPortal(menu, document.body)`.
	//
	// ITEMS (`DropdownMenuItem`, see ./types.ts): { key, value, hint, prefix, suffix, disabled, isTitle, isDivider, isSelected, checkIcon }.
	//   React `prefix(item)` / `suffix(item)` are functions returning nodes -> here Snippets with one parameter (the item):
	//     {#snippet heart()}<Heart size={16} />{/snippet}   items = [{ key: 'a', value: 'A', prefix: heart }]
	//   `value` / `hint` are node props (`Content`: string | number | Snippet).
	//   `onClickItem(item)` receives the item as normalised by `useMenuItems` (only the known fields, `disabled` resolved with `disabledItems`).
	//
	// BEHAVIOUR (all of it is what React does, nothing more - the component has NO keyboard handling of its own):
	//   * click on an enabled item -> `onClickItem(item)`, then `onClose()` when `isOpened && hideOnSelect` (default true); the click is
	//     stopped (`stopPropagation` + `stopImmediatePropagation`), disabled items / titles / dividers ignore it
	//   * click outside of the root AND the menu -> `onClose()` while `isOpened` (independent of `hideOnSelect`)
	//   * `headerSlot` / `footerSlot` = snippets `(hide, items)`; `hide()` = onClose when `isOpened && hideOnSelect`
	//   * the list (items) is mounted only while `isOpened`; an empty menu (`isEmpty`, default: no items) shows `emptyText`
	//   * `checkIcon` (component-level, NOT the per-item one) is drawn in front of selected items: a node, or `true` = the default 16px check
	//   * `virtualScroll` renders the items with a virtual list (virtua engine, overscan 4, item size 40 as in React) - `_VirtualList.svelte`,
	//     a copy of virtua/svelte's VList whose item wrappers also carry `margin: 0; padding: 0` like the React (virtua 0.34.2) DOM;
	//     non-virtual lists ignore `dropdownMenuListClassName` / `dropdownMenuListStyle` (React quirk, kept)
	//   * `ref` (bindable) = the menu element (React forwards the ref to it, not to the root)
	//
	// POPPER: usePopper({ enabled: isOpened, eventListeners: isOpened, placement, widthFitContent, pointerIsCentered: true, ...usePopperProps })
	//   trigger = the root element, popper = the menu element. `usePopperProps` (React prop) is spread last, so it can override anything
	//   (`{ trigger: otherEl, offset: 4, enabled: false, lazy: false ... }`).
	//   React only creates the Popper instance when the component re-renders AFTER mount (refs are `undefined` during the first render),
	//   so a closed menu that is never re-rendered has neither `style` nor `data-popper-placement`. Here (usePopper `lazy`) the instance is
	//   created once the menu has been opened (`isOpened` was true) - pass `usePopperProps={{ lazy: false }}` when the consumer re-renders
	//   in React (Select-like closed menus that already carry `data-popper-placement`) to create it immediately.
	import clsx from 'clsx';
	import { untrack, type Snippet } from 'svelte';
	import type { Action } from 'svelte/action';
	import type { HTMLAttributes } from 'svelte/elements';
	import Slot from '../../internal/Slot.svelte';
	import type { Content } from '../../internal/types.js';
	import CheckLarge16 from '../../icons/16/navigation/CheckLarge16.svelte';
	import Typography from '../Typography/Typography.svelte';
	import VirtualList from './_VirtualList.svelte';
	import { usePopper, type UsePopperOptions } from '../../hooks/usePopper.svelte.js';
	import type { PlacementsType } from '../../hooks/usePopper/constants.js';
	import { useOutsideClick } from '../../hooks/useOutsideClick.js';
	import { useFilterAttrs } from '../../hooks/useFilterAttrs.js';
	import { useModalContext } from '../../hooks/useModalContext.js';
	import { noop } from '../../utils/noop.js';
	import { styleToString, type StyleValue } from '../../utils/style.js';
	import { useMotion, type MotionProp } from '../../ext/motion.svelte.js';
	import { originFromPlacement, useShowMotion } from '../../ext/showMotion.svelte.js';
	import {
		DEFAULT_DROPDOWN_MENU_SIZE,
		DEFAULT_DROPDOWN_MENU_VARIANT,
		DEFAULT_EMPTY_TEXT,
		DROPDOWN_MENU_SIZES,
		DROPDOWN_MENU_VARIANTS,
		type DropdownMenuSize,
		type DropdownMenuVariant
	} from './constants.js';
	import { useMenuItems } from './hooks.js';
	import type { DropdownMenuItem } from './types.js';

	export interface DropdownMenuProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'style'> {
		/** Задаёт вариант для компонента */
		variant?: DropdownMenuVariant;
		/** Задаёт размер */
		size?: DropdownMenuSize;
		/** Элемент, от которого позиционируется меню (триггер) */
		children?: Snippet;
		/** Список элементов меню */
		items?: DropdownMenuItem[];
		/** Ключи отключённых элементов */
		disabledItems?: (string | number)[];
		/** Скрывает выбранные элементы */
		hideSelectedItems?: boolean;
		/** Пустое меню (по умолчанию: нет элементов) */
		isEmpty?: boolean;
		/** Текст (узел) для пустого меню */
		emptyText?: Content;
		/** Задаёт расположение относительно родительского компонента */
		placement?: PlacementsType;
		/** Открывает (показывает) меню */
		isOpened?: boolean;
		/** Включает виртуальный скролл */
		virtualScroll?: boolean;
		/** Задаёт вариант использования с Portal */
		useInPortal?: boolean;
		/** Ширина меню по содержимому (иначе — по ширине триггера) */
		widthFitContent?: boolean;
		/** Слот над списком: (hide, items) */
		headerSlot?: Snippet<[() => void, DropdownMenuItem[]]>;
		/** Слот под списком: (hide, items) */
		footerSlot?: Snippet<[() => void, DropdownMenuItem[]]>;
		/** Вызывается при закрытии меню (клик вне меню, выбор элемента при hideOnSelect) */
		onClose?: () => void;
		/** Задаёт параметры для popper.js */
		usePopperProps?: UsePopperOptions;
		/** Подсвечивает выбранный элемент цветом */
		isSelectedItemColored?: boolean;
		/** Дополнительные классы меню */
		dropdownMenuClassName?: string;
		/** Стили меню */
		dropdownMenuStyle?: StyleValue;
		/** Дополнительные классы списка (только для virtualScroll) */
		dropdownMenuListClassName?: string;
		/** Стили списка (только для virtualScroll) */
		dropdownMenuListStyle?: StyleValue;
		/** Иконка выбранного элемента (true — иконка по умолчанию) */
		checkIcon?: Content | boolean;
		/** Вызывается при клике на элемент */
		onClickItem?: (item: DropdownMenuItem) => void;
		/** Закрывать меню при выборе элемента */
		hideOnSelect?: boolean;
		/** Скрывать меню, если оно пустое */
		hideEmptyContent?: boolean;
		/** Стили корневого элемента */
		style?: StyleValue;
		/** Элемент меню (React `forwardRef`) */
		ref?: HTMLDivElement | null;
		/**
		 * [ext, not in original] Svelte-анимация открытия / закрытия меню (scale + fade из `transform-origin` по placement, Tween). Её же получают
		 * Select и Multiselect (они строятся на DropdownMenu). `undefined` — наследуется от `ExtMotionProvider` (без него выключено = оригинал),
		 * `false` — выключено, `true` / `{ duration, easing }` — включено.
		 */
		motion?: MotionProp;
	}

	let {
		variant = DEFAULT_DROPDOWN_MENU_VARIANT,
		size = DEFAULT_DROPDOWN_MENU_SIZE,
		children,
		items = [],
		disabledItems,
		hideSelectedItems,
		isEmpty: isEmptyProp,
		emptyText: emptyTextProp,
		placement,
		isOpened = false,
		virtualScroll = false,
		useInPortal = true,
		widthFitContent = true,
		headerSlot,
		footerSlot,
		onClose = noop,
		usePopperProps,
		isSelectedItemColored = true,
		dropdownMenuClassName: menuClasses = '',
		dropdownMenuStyle,
		dropdownMenuListClassName = '',
		dropdownMenuListStyle,
		checkIcon,
		onClickItem = noop,
		hideOnSelect = true,
		hideEmptyContent = false,
		ref = $bindable(null),
		motion,
		...restProps
	}: DropdownMenuProps = $props();

	const { isInModal } = useModalContext();

	const isEmpty = $derived(isEmptyProp === undefined ? items?.length === 0 : isEmptyProp);
	const rootAttrs = $derived(useFilterAttrs(restProps)[0]);
	const dropdownItems = $derived(useMenuItems({ items, disabledItems, hideSelectedItems, checkIcon }));

	let rootEl = $state<HTMLDivElement | null>(null);

	function hideDropdownMenuHandler() {
		if (isOpened && hideOnSelect) {
			onClose();
		}
	}

	useOutsideClick(
		() => [rootEl, ref],
		() => {
			if (isOpened) {
				onClose();
			}
		}
	);

	// see the POPPER note in the header: the instance appears once the menu has been opened
	let everOpened = $state(untrack(() => isOpened));
	$effect.pre(() => {
		if (isOpened) everOpened = true;
	});

	const pp = usePopper(() => ({
		enabled: isOpened,
		placement,
		eventListeners: isOpened,
		widthFitContent,
		pointerIsCentered: true,
		lazy: !everOpened,
		...usePopperProps
	}));

	function handleItemClick(e: MouseEvent, item: DropdownMenuItem) {
		e.stopPropagation();
		e.stopImmediatePropagation();
		if (!item.disabled) {
			onClickItem(item);
			hideDropdownMenuHandler();
		}
	}

	const rootOptionClassName = (item: DropdownMenuItem) =>
		clsx('atmr-dropdown-menu__item', {
			'atmr-dropdown-menu__item--selected': item.isSelected,
			'atmr-dropdown-menu__item--title': item.isTitle,
			'atmr-dropdown-menu__item--divider': item.isDivider,
			'atmr-dropdown-menu__item--disabled': item.disabled
		});

	const menuClassName = $derived(
		clsx(
			'atmr-dropdown-menu',
			`atmr-dropdown-menu--size-${DROPDOWN_MENU_SIZES[size]}`,
			`atmr-dropdown-menu--${DROPDOWN_MENU_VARIANTS[variant]}`,
			{
				'atmr-dropdown-menu--selected-item-colored': isSelectedItemColored,
				'atmr-dropdown-menu--virtual-scroll': !!virtualScroll,
				'atmr-dropdown-menu--in-modal': isInModal
			},
			`${menuClasses}`
		)
	);
	const rootClass = $derived(clsx(['atmr-dropdown-menu-root', rootAttrs.class]));
	const rootStyle = $derived(styleToString(rootAttrs.style));
	const menuStyle = $derived(styleToString(dropdownMenuStyle));
	const listStyle = $derived(styleToString({ height: '100%' }, dropdownMenuListStyle));
	const showMenu = $derived(hideEmptyContent ? !isEmpty && isOpened : isOpened);

	// [ext, not in original] Svelte-native open / close motion; `m.enabled` is false by default, then none of this does anything.
	// While the exit runs the menu stays shown and its list stays mounted (`showMotion.exiting`).
	const m = useMotion(() => motion, 'dropdown');
	const showMotion = useShowMotion({ m, node: () => ref, prop: () => motion, scale: 0.95, origin: () => originFromPlacement(pp.placement), onExited: () => pp.update() });
	let prevShown = untrack(() => showMenu);
	$effect.pre(() => {
		const value = showMenu;
		if (value === prevShown) return;
		prevShown = value;
		untrack(() => (value ? showMotion.enter() : showMotion.exit()));
	});

	// React `createPortal(menu, document.body)` when `useInPortal`, otherwise the menu stays inside the root element
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

{#snippet option(item: DropdownMenuItem)}
	<div data-key={item.key} class="atmr-dropdown-menu__item-wrapper">
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div role="presentation" class={rootOptionClassName(item)} onclick={(e) => handleItemClick(e, item)} data-testid="ddm__item">
			{#if !item.isDivider}
				{#if item.isSelected && checkIcon}
					<div class="atmr-dropdown-menu__check-icon">
						{#if typeof checkIcon !== 'boolean'}<Slot content={checkIcon} />{:else}<CheckLarge16 />{/if}
					</div>
				{/if}
				{#if item.prefix}<div class="atmr-dropdown-menu__prefix">{@render item.prefix(item)}</div>{/if}
				<div class="atmr-dropdown-menu__wrapper">
					<div class="atmr-dropdown-menu__content">
						<div class="atmr-dropdown-menu__text"><Slot content={item.value} /></div>
						{#if item.hint}<div class="atmr-dropdown-menu__hint"><Slot content={item.hint} /></div>{/if}
					</div>
					{#if item.suffix}<div class="atmr-dropdown-menu__suffix">{@render item.suffix(item)}</div>{/if}
				</div>
			{:else}
				<div class="atmr-dropdown-menu__divider"></div>
			{/if}
		</div>
	</div>
{/snippet}

<div {...rootAttrs} class={rootClass} style={rootStyle} bind:this={rootEl} use:pp.trigger>
	{@render children?.()}
	<div class={menuClassName} bind:this={ref} data-show={showMenu || showMotion.exiting} style={menuStyle} data-testid="ddm" use:pp.popper use:inPortal={useInPortal}>
		<div class="atmr-dropdown-menu__menu" data-testid="ddm__menu">
			{@render headerSlot?.(hideDropdownMenuHandler, dropdownItems)}
			{#if isEmpty}
				<div class="atmr-dropdown-menu__empty" data-testid="ddm__empty">
					<Typography variant="body-m" style={{ margin: 'var(--atmr-spacing-2x)' }}>
						{#if emptyTextProp === null || emptyTextProp === undefined}{DEFAULT_EMPTY_TEXT}{:else}<Slot content={emptyTextProp} />{/if}
					</Typography>
				</div>
			{:else if isOpened || showMotion.exiting}
				{#if virtualScroll}
					<div class={clsx('atmr-dropdown-menu__list', dropdownMenuListClassName)} style={listStyle}>
						<VirtualList data={dropdownItems} children={option} class="atmr-scroll-bar" style={{ contain: 'unset' }} />
					</div>
				{:else}
					<div class="atmr-dropdown-menu__list" style="height: 100%">
						<!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
						<ul role="listbox" class="atmr-scroll-bar">
							{#each dropdownItems as item}
								<li>{@render option(item)}</li>
							{/each}
						</ul>
					</div>
				{/if}
			{/if}
			{@render footerSlot?.(hideDropdownMenuHandler, dropdownItems)}
		</div>
	</div>
</div>
