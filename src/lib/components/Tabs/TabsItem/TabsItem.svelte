<script lang="ts">
	// Port of packages/ui-kit/src/components/Tabs/TabsItem/TabsItem.tsx
	//
	//   <TabsGroup value="0"><TabsItem index="0" label="Интернет">{#snippet icon()}<Internet />{/snippet}</TabsItem>...</TabsGroup>
	//
	// Inside a TabsGroup (Svelte context) `size` / `disabledAll` / `scrollable` / `verticalFill` / `activeIndex` / `tIndex` come from the group
	// and the tab is "selected" when `activeIndex === index`; clicking an enabled tab calls the group's `handleChange(index)` and `onClick(event)`.
	// Outside of a group the context is `{}` (React default), so `activeIndex === index` is `undefined === undefined` (= selected, tabindex 0).
	//
	// Svelte-only: the tab registers itself in the group (see ./../context.ts) which decides (`maxVisibleTabs`) whether it is rendered;
	// an overflowed tab renders NOTHING (React does not render the cloned element at all).
	// `disabled`: React skips tabs that carry an own `disabled` prop in the arrow-key navigation (`hasOwnProperty`); Svelte cannot see
	// "passed vs not passed" for a destructured prop, so an `undefined` `disabled` counts as "not passed".
	import clsx from 'clsx';
	import { onDestroy } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import Slot from '../../../internal/Slot.svelte';
	import type { Content } from '../../../internal/types.js';
	import { noop } from '../../../utils/noop.js';
	import { styleToString, type StyleValue } from '../../../utils/style.js';
	import { DEFAULT_TAB_SIZE, DEFAULT_TAB_VARIANT, TABS_ICON_POSITIONS, type TabsIconPosition, type TabsSize } from '../constants.js';
	import { getTabsContext, type TabsItemRegistration } from '../context.js';

	export interface TabsItemProps extends Omit<HTMLButtonAttributes, 'children' | 'style'> {
		/** Индекс (значение) вкладки, сравнивается с value TabsGroup */
		index?: string;
		/** Текст вкладки */
		label?: Content;
		/** Иконка вкладки */
		icon?: Content;
		/** Позиция иконки */
		iconPosition?: TabsIconPosition;
		/** Отключает вкладку */
		disabled?: boolean;
		/** Размер (внутри TabsGroup берётся из группы) */
		size?: TabsSize;
		/** Показывает индикатор (точку) */
		dot?: boolean;
		/** Стили корневого элемента (строка или объект как в React) */
		style?: StyleValue;
		/** Корневой элемент (React `forwardRef`) */
		ref?: HTMLButtonElement | null;
	}

	let {
		index,
		label,
		icon = null,
		iconPosition = TABS_ICON_POSITIONS.left,
		disabled: disabledProp,
		class: className,
		size: sizeProp = DEFAULT_TAB_SIZE,
		onclick = noop,
		dot = false,
		style,
		ref = $bindable(null),
		...restProps
	}: TabsItemProps = $props();

	const context = getTabsContext();

	const size = $derived(context.size ?? sizeProp);
	const variant = $derived(context.variant ?? DEFAULT_TAB_VARIANT);
	const isActive = $derived(context.activeIndex === index);
	const isDisabled = $derived(!!(context.disabledAll || disabledProp));
	const tabIndex = $derived(context.tIndex === index ? 0 : -1);
	const ariaLabel = $derived(label === null || label === undefined || typeof label === 'function' ? undefined : String(label));

	const registration: TabsItemRegistration = {
		get index() {
			return index;
		},
		get label() {
			return label;
		},
		get disabled() {
			return disabledProp;
		},
		get hasDisabledProp() {
			return disabledProp !== undefined;
		},
		focus() {
			ref?.focus();
		}
	};
	if (context.register) {
		onDestroy(context.register(registration));
	}
	const visible = $derived(context.isVisible ? context.isVisible(registration) : true);

	function onClickHandler(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
		if (!isDisabled) {
			if (context.handleChange) {
				context.handleChange(index as string);
			}
			(onclick as (event: MouseEvent) => void)(event);
		}
		if (context.scrollable) {
			ref?.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
		}
	}

	const rootClass = $derived(
		clsx(
			'atmr-tabs-item',
			`atmr-tabs-item--${variant}`,
			`atmr-tabs-item--size-${size}`,
			label && 'atmr-tabs-item--has-label',
			icon && `atmr-tabs-item--icon-${iconPosition}`,
			icon && 'atmr-tabs-item--icon',
			isActive && 'atmr-tabs-item--selected',
			isDisabled && 'atmr-tabs-item--disabled',
			context.scrollable && 'atmr-tabs-item--scrollable',
			context.verticalFill && 'atmr-tabs-item--vertical-fill',
			dot && 'atmr-tabs-item--dot',
			className
		)
	);
</script>

{#if visible}
	<button
		type="button"
		class={rootClass}
		bind:this={ref}
		disabled={isDisabled}
		onclick={onClickHandler}
		role="tab"
		aria-selected={isActive}
		tabindex={tabIndex}
		aria-label={ariaLabel}
		{...restProps}
		style={styleToString(style)}
	>
		<Slot content={icon} />
		<span class="atmr-tabs-item__text" role="presentation"><Slot content={label} /></span>
	</button>
{/if}
