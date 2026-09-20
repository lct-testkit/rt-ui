<script lang="ts">
	// Port of packages/ui-kit/src/components/Multiselect/SelectedOptionsContainer/SelectedOptionsContainer.tsx
	//
	// The tags row of the Multiselect: `div.atmr-tags-container[tabindex=0] > div.__innerContainer (scrolls) > div.__wrapper > TagItem... + TagInput`.
	//   * `gradientSide` (class `atmr-tags-container--gradient-side-<left|right|around|undefined>`) follows the horizontal scroll position of the
	//     inner container (only without `autoHeight`), exactly like React (the literal "undefined" class included)
	//   * React's effect (deps: the `items` array, which is a new array on every Multiselect render, `autoHeight`, ...) scrolls the row to its end
	//     after every render when `!autoHeight`; `updateKey` (Svelte only) stands for "the parent re-rendered" (search text / open / focus)
	import clsx from 'clsx';
	import TagItem from '../../Tag/TagItem/TagItem.svelte';
	import TagInput from '../../Tag/TagInput/TagInput.svelte';
	import type { TagSize, TagVariant } from '../../Tag/constants.js';
	import { noop } from '../../../utils/noop.js';
	import type { DropdownMenuItem } from '../../DropdownMenu/types.js';

	export interface SelectedOptionsContainerProps {
		/** Теги (`{ key, value, error?, disabled? }`) */
		items: DropdownMenuItem[];
		autoHeight?: boolean;
		disabled?: boolean;
		class?: string;
		autocompleteInputFocus?: boolean;
		/** Размер тегов */
		size: TagSize;
		/** Размер поля */
		inputSize: string;
		variant: TagVariant;
		onRemove?: (key: string | number) => void;
		inputVisible?: boolean;
		/** Элемент <input> */
		inputRef?: HTMLInputElement | null;
		/** Атрибуты <input> */
		inputProps?: Record<string, any>;
		/** Svelte only: меняется при каждой перерисовке родителя */
		updateKey?: unknown;
	}

	let {
		items,
		autoHeight,
		disabled,
		class: className,
		autocompleteInputFocus,
		size,
		variant,
		inputSize,
		onRemove = noop,
		inputVisible,
		inputRef = $bindable(null),
		inputProps,
		updateKey
	}: SelectedOptionsContainerProps = $props();

	let containerEl = $state<HTMLDivElement | null>(null);
	let gradientSide = $state<'left' | 'right' | 'around' | undefined>(undefined);

	function scrollHandler(): 'left' | 'right' | 'around' | undefined {
		const el = containerEl;
		if (!autoHeight && el) {
			if (el.scrollWidth > el.clientWidth) {
				if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 4) {
					return 'left';
				}
				if (el.scrollLeft <= 4) {
					return 'right';
				}
				return 'around';
			}
		}
		return undefined;
	}

	$effect(() => {
		items;
		autoHeight;
		autocompleteInputFocus;
		updateKey;
		const el = containerEl;
		if (!autoHeight && el?.scrollBy) {
			el.scrollBy(el.scrollWidth, 0);
			scrollHandler();
		}
	});

	// React `key={t.key}`: keyed by the tag key (duplicates, which React only warns about, get a suffix instead of throwing)
	const keyedItems = $derived.by(() => {
		const seen = new Map<string, number>();
		return items.map((t) => {
			const k = String(t.key);
			const n = seen.get(k) ?? 0;
			seen.set(k, n + 1);
			return { t, k: n ? `${k}#${n}` : k };
		});
	});

	const rootClassName = $derived(
		clsx(
			'atmr-tags-container',
			`atmr-tags-container--gradient-side-${gradientSide}`,
			`atmr-tags-container--size-${inputSize}`,
			`atmr-tags-container--tagsize-${size}`,
			{
				'atmr-tags-container--autoHeight': autoHeight,
				'atmr-tags-container--disabled': !!disabled
			},
			className
		)
	);
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div class={rootClassName} tabindex="0">
	<div class="atmr-tags-container__innerContainer" bind:this={containerEl} onscroll={() => (gradientSide = scrollHandler())}>
		<div class="atmr-tags-container__wrapper">
			{#each keyedItems as { t, k } (k)}
				<TagItem
					disabled={disabled || !!t.disabled}
					error={!!t?.error}
					closable
					onClose={(e) => {
						e.stopPropagation();
						onRemove(t.key);
					}}
					{size}
					{variant}
				>
					{t.value}
				</TagItem>
			{/each}
			{#if inputVisible}
				<TagInput class="atmr-tags-container__taginput" bind:ref={inputRef} {size} {variant} {...inputProps} />
			{/if}
		</div>
	</div>
</div>
