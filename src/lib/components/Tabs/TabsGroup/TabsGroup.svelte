<script lang="ts">
	// Port of packages/ui-kit/src/components/Tabs/TabsGroup/TabsGroup.tsx
	//
	//   <TabsGroup value={val} onChange={(index) => (val = index)} maxVisibleTabs={5}>
	//     <TabsItem index="0" label="One" /> <TabsItem index="1" label="Two" /> ...
	//   </TabsGroup>
	//   <TabsPanel value={val} index="0">...</TabsPanel>
	//
	// DOM (identical to React):
	//   <div class="atmr-tabs-group atmr-tabs-group--primary atmr-tabs-group--size-m [--scrollable | --overflow-menu] [--vertical-fill] [--border]" ...rest>
	//     <div class="atmr-tabs-group__tabs" role="tablist" tabindex="0">
	//       {TabsItem buttons}
	//       <span class="atmr-tabs-group__more" role="presentation"><DropdownMenu ...><IconButton aria-label="Ещё" .../></DropdownMenu></span>   <- maxVisibleTabs overflow
	//
	// BEHAVIOUR: active tab (`value` initial state + re-synced when `value` changes), `onChange(index)` may return `false` / a Promise<false>
	// to veto the change, ArrowLeft / ArrowRight roving focus over the tabs without an own `disabled` prop, drag-to-scroll in scroll mode
	// (`horizontalFill={false}` or `scrollable`), overflow menu for `maxVisibleTabs` (the active tab is always moved into the visible ones).
	//
	// Svelte: React reads the TabsItem children's props; here the TabsItems register in the group (context.ts) in declaration order.
	// Non-TabsItem content of the snippet is rendered as is (React drops it).
	import clsx from 'clsx';
	import { untrack, type Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import IconButton from '../../Button/IconButton/IconButton.svelte';
	import DropdownMenu from '../../DropdownMenu/DropdownMenu.svelte';
	import type { DropdownMenuItem } from '../../DropdownMenu/types.js';
	import More16 from '../../../icons/16/navigation/More16.svelte';
	import More from '../../../icons/24/navigation/More.svelte';
	import { PLACEMENTS } from '../../../hooks/usePopper/constants.js';
	import { styleToString, type StyleValue } from '../../../utils/style.js';
	// [ext, not in original] author's motion extension (off by default, see src/lib/ext/README.md)
	import { useIndicatorMotion } from '../../../ext/indicatorMotion.svelte.js';
	import { useMotion, type MotionProp } from '../../../ext/motion.svelte.js';
	import { DEFAULT_TAB_SIZE, DEFAULT_TAB_VARIANT, type TabsSize, type TabsVariant } from '../constants.js';
	import { setTabsContext, type TabsItemRegistration } from '../context.js';

	export interface TabsGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onchange' | 'style'> {
		/** Задаёт вариант для компонента */
		variant?: TabsVariant;
		/** Задаёт размер */
		size?: TabsSize;
		/** Блокирует все вкладки */
		disabledAll?: boolean;
		/** Индекс активной вкладки */
		value: string;
		/** Показывает нижнюю границу */
		border?: boolean;
		/** Вкладки занимают всю ширину (иначе включается режим прокрутки) */
		horizontalFill?: boolean;
		/** Режим прокрутки (приоритетнее horizontalFill: horizontalFill = !scrollable) */
		scrollable?: boolean;
		/** Максимум видимых вкладок, остальные попадают в меню «Ещё» */
		maxVisibleTabs?: number;
		/** Вкладки занимают всю высоту */
		verticalFill?: boolean;
		/** Вызывается при выборе вкладки; результат `false` отменяет смену вкладки */
		onChange?: (index: string) => false | void | Promise<false | void>;
		/** Вкладки (TabsItem) */
		children?: Snippet;
		/** Стили корневого элемента (строка или объект как в React) */
		style?: StyleValue;
		/**
		 * [ext, not in original] Svelte-анимация индикатора активной вкладки: одна линия «переезжает» (Tween или Spring: left + width) с прежней вкладки на новую
		 * вместо того, чтобы каждая вкладка рисовала свою. `undefined` — наследуется от `ExtMotionProvider` (без него выключено = оригинал), `false` — выключено,
		 * `true` / `'tween'` / `'spring'` / `{ duration, easing, stiffness, damping }` — включено. Панель (`TabsPanel`) анимируется своим `motion`.
		 */
		motion?: MotionProp;
	}

	let {
		variant = DEFAULT_TAB_VARIANT,
		size = DEFAULT_TAB_SIZE,
		disabledAll = false,
		value,
		border = true,
		horizontalFill: horizontalFillProp = true,
		scrollable,
		maxVisibleTabs,
		verticalFill = false,
		class: classes = '',
		onChange,
		children,
		style,
		motion,
		...restProps
	}: TabsGroupProps = $props();

	const resolveHorizontalFill = (fill: boolean | undefined, scroll: boolean | undefined): boolean => {
		if (scroll !== undefined) return !scroll;
		return fill ?? true;
	};

	const splitVisibleAndOverflowTabs = (allTabs: TabsItemRegistration[], max: number | undefined, activeKey: string | undefined) => {
		const hasOverflow = max !== undefined && max > 0 && allTabs.length > max;
		if (!hasOverflow || max === undefined) {
			return { hasOverflowMenu: false, visibleTabs: allTabs, overflowTabs: [] as TabsItemRegistration[] };
		}
		const activeIdx = allTabs.findIndex((tab) => tab.index === activeKey);
		const visible = activeIdx >= max ? [...allTabs.slice(0, max - 1), allTabs[activeIdx]] : allTabs.slice(0, max);
		const visibleKeys = new Set(visible.map((tab) => tab.index));
		const overflow = allTabs.filter((tab) => !visibleKeys.has(tab.index));
		return { hasOverflowMenu: true, visibleTabs: visible, overflowTabs: overflow };
	};

	const horizontalFill = $derived(resolveHorizontalFill(horizontalFillProp, scrollable));
	const isScrollMode = $derived(!horizontalFill);

	let ref = $state<HTMLDivElement | null>(null);
	// svelte-ignore state_referenced_locally
	let activeIndex = $state<string | undefined>(value);
	let isScrolling = false;
	let startX = 0;
	let scrollX = 0;
	let overflowOpen = $state(false);
	// React re-renders TabsGroup (and with it the DropdownMenu, which only then creates its Popper instance for the still closed menu) after every
	// state update / parent re-render. Svelte has no re-render, so the overflow menu switches to a non-lazy Popper after the first interaction.
	let rerendered = $state(false);

	// registered TabsItems (declaration order)
	let allTabs = $state.raw<TabsItemRegistration[]>([]);
	function register(tab: TabsItemRegistration): () => void {
		allTabs = [...allTabs, tab];
		return () => {
			allTabs = allTabs.filter((t) => t !== tab);
		};
	}

	const split = $derived(splitVisibleAndOverflowTabs(allTabs, maxVisibleTabs, activeIndex));
	const hasOverflowMenu = $derived(split.hasOverflowMenu);
	const visibleSet = $derived(new Set(split.visibleTabs));
	const overflowTabs = $derived(split.overflowTabs);
	const tabItems = $derived(allTabs.filter((tab) => !tab.hasDisabledProp));

	// roving tabindex owner: `useState(() => tabItems.find(index === value)?.index ?? tabItems[0]?.index)` (first render), then set by
	// handleChange / value changes / arrow keys. The registry is filled while the children render, so the initial value is derived lazily.
	const initialValue = untrack(() => value);
	let tIndexSet = $state(false);
	let tIndexValue = $state<string | undefined>(undefined);
	const initialTIndex = $derived(tabItems.find((item) => item.index === initialValue)?.index ?? tabItems[0]?.index);
	const tIndex = $derived(tIndexSet ? tIndexValue : initialTIndex);
	function setTIndex(index: string | undefined) {
		tIndexValue = index;
		tIndexSet = true;
	}

	const effectiveScrollable = $derived(Boolean(isScrollMode || hasOverflowMenu));

	// ---- [ext, not in original] motion: one indicator glides between the tabs; nothing is rendered or changed while it is off -----------------------------
	const m = useMotion(() => motion, 'tabs');
	let tabsEl = $state<HTMLElement | null>(null);
	let indicatorEl = $state<HTMLElement | null>(null);
	const selectedDisabled = $derived(disabledAll || Boolean(allTabs.find((tab) => tab.index === activeIndex)?.disabled));
	useIndicatorMotion({
		m,
		container: () => tabsEl,
		indicator: () => indicatorEl,
		target: () => {
			void activeIndex; // re-read once the selection / the visible tabs have been rendered
			void allTabs;
			return tabsEl?.querySelector<HTMLElement>('.atmr-tabs-item--selected') ?? null;
		},
		prop: () => motion
	});

	const overflowItems = $derived<DropdownMenuItem[]>(
		overflowTabs.map((tab) => ({
			key: tab.index as string,
			value: tab.label ?? '',
			disabled: Boolean(tab.disabled) || disabledAll,
			isSelected: tab.index === activeIndex
		}))
	);

	function handleClickRight() {
		if (tIndex === tabItems[tabItems.length - 1]?.index) {
			setTIndex(tabItems[0]?.index);
			tabItems[0]?.focus();
			return;
		}
		const temp = tabItems.findIndex((item) => item.index === tIndex);
		setTIndex(tabItems[temp + 1]?.index);
		tabItems[temp + 1]?.focus();
	}

	function handleClickLeft() {
		if (tIndex === tabItems[0]?.index) {
			setTIndex(tabItems[tabItems.length - 1]?.index);
			tabItems[tabItems.length - 1]?.focus();
			return;
		}
		const temp = tabItems.findIndex((item) => item.index === tIndex);
		setTIndex(tabItems[temp - 1]?.index);
		tabItems[temp - 1]?.focus();
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'ArrowLeft') {
			rerendered = true;
			handleClickLeft();
		}
		if (e.key === 'ArrowRight') {
			rerendered = true;
			handleClickRight();
		}
	}

	async function handleChange(index: string): Promise<void> {
		rerendered = true;
		if (onChange) {
			const shouldContinue = await onChange(index);
			if (shouldContinue === false) return;
		}
		activeIndex = index;
		setTIndex(index);
	}

	function onMouseDown(event: MouseEvent) {
		if (!ref) return;
		isScrolling = true;
		startX = event.pageX - ref.offsetLeft;
		scrollX = ref.scrollLeft;
	}
	function onMouseUp() {
		ref?.classList.remove('atmr-tabs-group--grab');
		isScrolling = false;
	}
	function onMouseLeave() {
		isScrolling = false;
	}
	function onMouseMove(event: MouseEvent) {
		if (!isScrolling || !ref) return;
		event.preventDefault();
		ref.classList.add('atmr-tabs-group--grab');
		const x = event.pageX - ref.offsetLeft;
		ref.scrollLeft = scrollX - (x - startX);
	}

	// useEffect(handleValueChanged, [value])
	// svelte-ignore state_referenced_locally
	let prevValue = value;
	$effect.pre(() => {
		const next = value;
		untrack(() => {
			if (next !== prevValue) {
				prevValue = next;
				rerendered = true;
			}
			if (next !== undefined && next !== activeIndex) {
				activeIndex = next;
				setTIndex(next);
			}
		});
	});

	setTabsContext({
		get size() {
			return size;
		},
		get scrollable() {
			return effectiveScrollable;
		},
		get verticalFill() {
			return verticalFill;
		},
		get disabledAll() {
			return disabledAll;
		},
		get activeIndex() {
			return activeIndex;
		},
		get tIndex() {
			return tIndex;
		},
		get tabsRef() {
			return ref;
		},
		handleChange,
		register,
		isVisible: (tab) => visibleSet.has(tab)
	});

	const rootClass = $derived(
		clsx(
			'atmr-tabs-group',
			`atmr-tabs-group--${variant}`,
			`atmr-tabs-group--size-${size}`,
			isScrollMode && !hasOverflowMenu && 'atmr-tabs-group--scrollable',
			hasOverflowMenu && 'atmr-tabs-group--overflow-menu',
			verticalFill && 'atmr-tabs-group--vertical-fill',
			border && 'atmr-tabs-group--border',
			m.enabled && 'rt-ext-tabs',
			classes
		)
	);
	const scrollHandlers = $derived(
		isScrollMode && !hasOverflowMenu ? { onmousedown: onMouseDown, onmouseup: onMouseUp, onmousemove: onMouseMove, onmouseleave: onMouseLeave } : {}
	);
</script>

{#snippet moreIcon()}
	{#if size === 's'}<More16 size={16} />{:else}<More size={20} />{/if}
{/snippet}

<div bind:this={ref} {...scrollHandlers} class={rootClass} {...restProps} style={styleToString(style)}>
	<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
	<div bind:this={tabsEl} class="atmr-tabs-group__tabs" role="tablist" tabindex="0" onkeydown={handleKeyDown}>
		{@render children?.()}
		{#if hasOverflowMenu}
			<span class="atmr-tabs-group__more" role="presentation">
				<DropdownMenu
					isOpened={overflowOpen}
					onClose={() => (overflowOpen = false)}
					items={overflowItems}
					placement={PLACEMENTS.bottomRight}
					size={size === 's' ? 's' : 'm'}
					onClickItem={async (item) => {
						await handleChange(String(item.key));
						overflowOpen = false;
					}}
					usePopperProps={{ offset: 4, ...(rerendered ? { lazy: false } : {}) }}
				>
					<IconButton
						type="button"
						aria-label="Ещё"
						aria-haspopup="listbox"
						aria-expanded={overflowOpen}
						size={size === 's' ? 's' : 'm'}
						variant="ghost"
						colorScheme="neutral"
						disabled={disabledAll}
						icon={moreIcon}
						onclick={() => (overflowOpen = !overflowOpen)}
					/>
				</DropdownMenu>
			</span>
		{/if}
		{#if m.enabled}<span class={['rt-ext-tabs-indicator', selectedDisabled && 'rt-ext-tabs-indicator--disabled']} aria-hidden="true" bind:this={indicatorEl}></span>{/if}
	</div>
</div>
