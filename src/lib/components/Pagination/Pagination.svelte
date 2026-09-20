<script lang="ts">
	// Port of packages/ui-kit/src/components/Pagination/Pagination.tsx (+ usePagination.tsx -> ./usePagination.ts)
	//
	//   <Pagination count={200} pageSize={10} alignment="left" pageSizeChanger={{ enabled: true, pageSizeOptions: [10, 25, 50] }}
	//               total={{ enabled: true }} jumper={{ enabled: true }} onPageChange={(page) => ...} onPageSizeChange={(size) => ...} />
	//
	// DOM (identical to React): `div.atmr-pagination` (gets the rest props: `id`, `style`, `data-*`, `aria-*`, `onclick` ...) that holds, in this order,
	//   navigation buttons (`alignment="left"`)  |  `div.atmr-pagination__container` (Total label + PageSizeChanger = a `Select`)
	//   |  navigation buttons (`alignment="right"`)  |  `div.atmr-pagination__jumper` (`Input` between two labels).
	//
	// PROPS = React props (see `PaginationProps`). Node props (`chevronLeftIcon`, `chevronRightIcon`, `moreIcon`, `total.label`, `jumper.labelPrefix`,
	// `jumper.labelSuffix`) take a string / number / Snippet. `style` accepts a CSS string or a React-like style object.
	//
	// BEHAVIOUR (all of it is what React does):
	//   * `count` = total number of ELEMENTS, the number of pages is `ceil(count / pageSize)` (`pageSize` unset = one element per page)
	//   * `page` set (truthy) = controlled: the component follows the prop and only reports clicks with `onPageChange(page)`; unset = it keeps
	//     its own page (starts at 1). `onPageChange` also fires when the Jumper is left / Enter is pressed (page clamped to 1..pages)
	//   * `type`: `buttons` (previous, numbered buttons with ellipsis, next) | `buttonsMobile` (only the pages around the current one) |
	//     `withLabel` (previous, "page/pages", next) | `onlySlider` (previous, next); `siblingCount` = number of buttons on each side of the current page
	//   * Jumper = numeric `Input`: the value is applied on blur / Enter (clamped) and selected on focus; PageSizeChanger = read-only `Select`
	//     (`pageSizeOptions`: numbers or `{ key, value }` items) that reports `onPageSizeChange(Number(key))`
	//   * React quirks that are kept on purpose: `alignment` has no default (without it no navigation buttons are rendered and the root gets the
	//     class `atmr-pagination--aligment-undefined`); the boundary buttons (first / last page) are only rendered when `type` is passed explicitly
	//     as `buttons`; the Jumper input is not re-synced with the page after being clamped
	import clsx from 'clsx';
	import { untrack } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import ChevronLeft from '../../icons/24/navigation/ChevronLeft.svelte';
	import ChevronRight from '../../icons/24/navigation/ChevronRight.svelte';
	import More from '../../icons/24/navigation/More.svelte';
	import Slot from '../../internal/Slot.svelte';
	import type { Content } from '../../internal/types.js';
	import { noop } from '../../utils/noop.js';
	import { styleToString, type StyleValue } from '../../utils/style.js';
	import type { DropdownMenuItem } from '../DropdownMenu/types.js';
	import Input, { type InputProps } from '../Input/Input.svelte';
	import Select, { type SelectProps } from '../Select/Select.svelte';
	import {
		CHEVRON_SIZE_MAP,
		PAGINATION_ALIGNMENT,
		PAGINATION_SIZES,
		PAGINATION_TYPES,
		PAGINATION_VARIANTS,
		type PaginationAlignment,
		type PaginationSize,
		type PaginationType,
		type PaginationVariant
	} from './constants.js';
	import { usePagination } from './usePagination.js';

	/** Параметры элемента Total */
	export interface PaginationTotal {
		/** Включает отображение элемента Total */
		enabled?: boolean;
		/** Текст лейбла компонента (по умолчанию «Всего: <число страниц>») */
		label?: Content;
	}

	/** Параметры элемента PageSizeChanger */
	export interface PaginationPageSizeChanger {
		/** Включает отображение элемента PageSizeChanger */
		enabled?: boolean;
		/** Опции выбора количества элементов на странице: числа или элементы `{ key, value }` */
		pageSizeOptions?: (number | DropdownMenuItem)[];
		/** Остальные пропсы для компонента Select */
		props?: Partial<SelectProps>;
	}

	/** Параметры элемента Jumper */
	export interface PaginationJumper {
		/** Включает отображение элемента Jumper */
		enabled?: boolean;
		/** Текст лейбла компонента в «начале» (по умолчанию «Страница») */
		labelPrefix?: Content;
		/** Текст лейбла компонента в «конце» (по умолчанию «из <число страниц>») */
		labelSuffix?: Content;
		/** Остальные пропсы для компонента Input */
		props?: Partial<InputProps>;
	}

	export interface PaginationProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'style'> {
		/** Задает размер */
		size?: PaginationSize;
		/** Задаёт вариант для компонента */
		variant?: PaginationVariant;
		/** Задаёт вид кнопок навигации */
		type?: PaginationType;
		/** Устанавливает атрибут disabled */
		disabled?: boolean;
		/** Задаёт суммарное количество элементов */
		count: number;
		/** Активная страница */
		page?: number;
		/** Задаёт количество элементов на одной странице */
		pageSize?: number;
		/** Callback-функция, вызываемая при изменении активной страницы */
		onPageChange?: (page: number) => void;
		/** Callback-функция, вызываемая при изменении количества элементов на странице */
		onPageSizeChange?: (pageSize: number) => void;
		/** Задаёт параметры для элемента Total */
		total?: PaginationTotal;
		/** Задаёт параметры для элемента PageSizeChanger */
		pageSizeChanger?: PaginationPageSizeChanger;
		/** Задаёт параметры для элемента Jumper */
		jumper?: PaginationJumper;
		/** Выравнивает компонент по одной из сторон. При использовании вместе с элементами Total и/или PageSizeChanger, меняется с ними местами. Элемент Jumper всегда остаётся прижатым к правому краю */
		alignment?: PaginationAlignment;
		/** Задаёт кастомную иконку для кнопки "Previous" */
		chevronLeftIcon?: Content;
		/** Задаёт кастомную иконку для кнопки "Next" */
		chevronRightIcon?: Content;
		/** Задаёт кастомную иконку для многоточия */
		moreIcon?: Content;
		/** Задаёт количество отображаемых кнопок по бокам от выбранной страницы */
		siblingCount?: number;
		style?: StyleValue;
	}

	let {
		size = PAGINATION_SIZES.m,
		variant = PAGINATION_VARIANTS.primary,
		type: typeProp,
		disabled,
		count,
		page: pageProp,
		pageSize,
		onPageChange = noop,
		onPageSizeChange = noop,
		total: totalProp,
		pageSizeChanger: pageSizeChangerProp,
		jumper: jumperProp,
		alignment,
		class: className,
		chevronLeftIcon,
		chevronRightIcon,
		moreIcon,
		siblingCount,
		style,
		...restProps
	}: PaginationProps = $props();

	// React: `type = PAGINATION_TYPES.buttons`, but `usePagination` receives the raw prop (see `usePagination.ts`)
	const type = $derived(typeProp === undefined ? PAGINATION_TYPES.buttons : typeProp);

	const pageCount = $derived(pageSize ? Math.ceil(count / pageSize) : count);
	const total = $derived({ enabled: false, label: `Всего: ${pageCount}`, ...totalProp });
	const pageSizeChanger = $derived({ enabled: false, pageSizeOptions: [], ...pageSizeChangerProp });
	const jumper = $derived({ enabled: false, labelPrefix: 'Страница', labelSuffix: `из ${pageCount}`, ...jumperProp });

	let page = $state<number>(untrack(() => (pageProp != null ? pageProp : 1)));
	let jumperValue = $state<string | number>(untrack(() => (pageProp != null ? pageProp : '1')));

	// React: `useEffect(() => { if (pageProp) { setPage(pageProp); if (jumper.enabled) setJumperValue(pageProp) } }, [pageProp])`
	$effect(() => {
		const next = pageProp;
		untrack(() => {
			if (next) {
				page = next;
				if (jumper.enabled) {
					jumperValue = next;
				}
			}
		});
	});

	function handleClickButton(value: number) {
		if (!pageProp) {
			page = value;
		}
		onPageChange(value);
		if (jumper.enabled) {
			jumperValue = value;
		}
	}

	const buttonPage = (buttonType: string): number | null => (buttonType === 'previous' ? page - 1 : buttonType === 'next' ? page + 1 : null);

	const items = $derived(usePagination({ count, page, pageSize, disabled, type: typeProp, siblingCount }).items);

	const rootClassName = $derived(
		clsx(
			'atmr-pagination',
			`atmr-pagination--${PAGINATION_VARIANTS[variant]}`,
			`atmr-pagination--size-${PAGINATION_SIZES[size]}`,
			`atmr-pagination--aligment-${alignment}`,
			className
		)
	);

	/** React spreads the whole `item` onto the <button>: `type` is the item kind (`page` / `previous` / `next`, not a valid button type) and `page` the target page */
	const itemAttrs = (item: { type: string; page?: number | null }): Record<string, any> => ({ type: item.type, page: item.page });

	/** `previous` / `next` button of the `withLabel` and `onlySlider` types (React `renderLeftRightButton({ type })`) */
	const plainNavItem = (navType: 'previous' | 'next') => ({
		type: navType,
		page: undefined,
		disabled: disabled || (navType === 'next' ? page >= pageCount : page <= 1)
	});

	function handleJumperChange(event: Event) {
		const value = (event.target as HTMLInputElement).value;
		// React compares the string with numbers (`value >= pageCount`), i.e. numerically
		const numeric = Number(value);
		let newPage: number;
		if (numeric >= pageCount) {
			newPage = pageCount;
		} else if (numeric <= 1) {
			newPage = 1;
		} else {
			newPage = numeric;
		}
		if (!pageProp) {
			page = newPage;
		}
		onPageChange(newPage);
	}

	const changerItems = $derived(
		pageSizeChanger.pageSizeOptions?.map((item): DropdownMenuItem => (typeof item === 'object' ? item : { key: item, value: `${item} на странице` }))
	);
</script>

{#snippet chevronLeft()}
	{#if chevronLeftIcon}<Slot content={chevronLeftIcon} />{:else}<ChevronLeft size={CHEVRON_SIZE_MAP[size]} />{/if}
{/snippet}

{#snippet chevronRight()}
	{#if chevronRightIcon}<Slot content={chevronRightIcon} />{:else}<ChevronRight size={CHEVRON_SIZE_MAP[size]} />{/if}
{/snippet}

<!-- `previous` / `next` button: `item` = { type, page?, disabled } -->
{#snippet leftRightButton(item: { type: 'previous' | 'next'; page?: number | null; disabled: boolean | undefined })}
	<button
		class="atmr-pagination__button"
		disabled={item.disabled}
		onclick={() => handleClickButton(buttonPage(item.type) as number)}
		{...itemAttrs(item)}
	>
		{#if item.type === 'next'}{@render chevronRight()}{:else}{@render chevronLeft()}{/if}
	</button>
{/snippet}

{#snippet navigationButtons()}
	{#if type === PAGINATION_TYPES.buttons || type === PAGINATION_TYPES.buttonsMobile}
		<ul class="atmr-pagination__buttons">
			{#each items as item}
				<li class={clsx('atmr-pagination__button', `atmr-pagination__${item.type}`)}>
					{#if item.type === 'start-ellipsis' || item.type === 'end-ellipsis'}
						{#if moreIcon}<Slot content={moreIcon} />{:else}<More size={16} />{/if}
					{:else}
						<!-- one <button> for pages, previous and next (React reuses it while the item at this position changes its kind) -->
						<button
							class={item.type === 'page' ? clsx('atmr-pagination__button', { 'atmr-pagination--selected': item.selected }) : 'atmr-pagination__button'}
							disabled={item.disabled}
							aria-current={item['aria-current']}
							onclick={() => handleClickButton(item.page as number)}
							{...itemAttrs(item)}
						>
							{#if item.type === 'page'}
								<span class="atmr-pagination__button-label">{item.page}</span>
							{:else if item.type === 'next'}
								{@render chevronRight()}
							{:else}
								{@render chevronLeft()}
							{/if}
						</button>
					{/if}
				</li>
			{/each}
		</ul>
	{:else if type === PAGINATION_TYPES.withLabel}
		<div class="atmr-pagination__buttons atmr-pagination__infolabel">
			{@render leftRightButton(plainNavItem('previous'))}
			<div class="atmr-pagination__buttons-label">{page}/{pageCount}</div>
			{@render leftRightButton(plainNavItem('next'))}
		</div>
	{:else}
		<div class="atmr-pagination__buttons">
			{@render leftRightButton(plainNavItem('previous'))}
			{@render leftRightButton(plainNavItem('next'))}
		</div>
	{/if}
{/snippet}

{#snippet jumperElement()}
	<div class="atmr-pagination__jumper">
		{#if jumper.labelPrefix}
			<span class="atmr-pagination__jumper-label"><Slot content={jumper.labelPrefix} /></span>
		{/if}
		<Input
			class="atmr-pagination__jumper-input"
			value={jumperValue.toString()}
			onBlur={handleJumperChange}
			onChange={(e) => (jumperValue = e.target.value)}
			transformationRule={{ transform: (inputValue = '') => inputValue.replace(/\D/g, '') }}
			onkeydown={(e) => {
				if (e.key === 'Enter') {
					handleJumperChange(e);
				}
			}}
			onFocus={(e) => (e.target as HTMLInputElement).select()}
			{size}
			showLabel={false}
			{disabled}
			{...jumper.props}
		/>
		{#if jumper.labelSuffix}
			<span class="atmr-pagination__jumper-label"><Slot content={jumper.labelSuffix} /></span>
		{/if}
	</div>
{/snippet}

{#snippet pageSizeChangerElement()}
	{#if pageSizeChanger.enabled && !!pageSizeChanger.pageSizeOptions}
		<Select
			items={changerItems}
			showLabel={false}
			value={pageSize}
			onChange={(v) => {
				onPageSizeChange(Number(v));
			}}
			{size}
			placement="top"
			{disabled}
			autocomplete={{ enabled: false }}
			{...pageSizeChanger.props}
		/>
	{/if}
{/snippet}

<div {...restProps} class={rootClassName} style={styleToString(style)}>
	{#if alignment === PAGINATION_ALIGNMENT.left}
		{@render navigationButtons()}
	{/if}
	{#if total.enabled || pageSizeChanger.enabled}
		<div class="atmr-pagination__container">
			{#if total.enabled}
				<span class="atmr-pagination__total"><Slot content={total.label} /></span>
			{/if}
			{#if pageSizeChanger.enabled}
				{@render pageSizeChangerElement()}
			{/if}
		</div>
	{/if}
	{#if alignment === PAGINATION_ALIGNMENT.right}
		{@render navigationButtons()}
	{/if}
	{#if jumper.enabled}
		{@render jumperElement()}
	{/if}
</div>
