<script lang="ts">
	// Port of packages/ui-kit/src/components/List/ListItem.tsx
	//
	//   <ListItem selected onclick={...}>{#snippet prefix()}<Icon />{/snippet}Text</ListItem>
	//
	// DOM: <li class="atmr-list-item [--disabled] [--selected] [--clickable]" (atmr-box ...)>
	//        [<div class="atmr-list-item__prefix">prefix</div>] <div class="atmr-list-item__content">children</div>
	//        [<div class="atmr-list-item__suffix">suffix</div>]
	// A ListItem is a Box (`tag="li"`): every Box prop is accepted, and the Box "modifier props" (`selected_bg`, `disabled_cursor`,
	// `clickable_px` ...) are resolved with the active modifiers `disabled` / `selected` / `clickable` (= `onclick` is set).
	// `onclick` is a component prop (React `onClick`): it is not called while the item is `disabled`.
	import clsx from 'clsx';
	import type { ComponentProps, Snippet } from 'svelte';
	import Box from '../Box/Box.svelte';
	import Slot from '../../internal/Slot.svelte';
	import type { Content } from '../../internal/types.js';
	import { boxMods, boxWithMods } from '../../utils/boxMods.js';

	type BoxProps = ComponentProps<typeof Box>;

	export interface ListItemProps extends Omit<BoxProps, 'children' | 'tag' | 'ref' | 'onclick' | 'prefix'> {
		/** Содержимое элемента списка */
		children?: Snippet;
		/** Иконка / контент в «начале» элемента */
		prefix?: Content;
		/** Иконка / контент в «конце» элемента */
		suffix?: Content;
		/** Отключает элемент (клик не вызывает onclick) */
		disabled?: boolean;
		/** Выбранный элемент */
		selected?: boolean;
		/** Обработчик клика (React `onClick`) */
		onclick?: (event: MouseEvent) => void;
		/** Корневой элемент (аналог forwardRef) */
		ref?: HTMLElement | null;
		/** Box-пропсы с модификаторами: `selected_bg`, `disabled_cursor`, `clickable_px` ... */
		[key: string]: unknown;
	}

	let {
		children,
		class: className,
		prefix,
		suffix,
		disabled = false,
		selected = false,
		onclick,
		ref = $bindable(null),
		...boxProps
	}: ListItemProps = $props();

	const mods = $derived(boxMods({ disabled, selected, clickable: !!onclick }));
	const boxPropsWithMods = $derived(boxWithMods(boxProps, mods));

	const rootClassName = $derived(
		clsx('atmr-list-item', { 'atmr-list-item--disabled': disabled, 'atmr-list-item--selected': selected, 'atmr-list-item--clickable': !!onclick }, className)
	);

	function handleClick(event: MouseEvent) {
		if (disabled) return;
		onclick?.(event);
	}
</script>

<Box {...boxPropsWithMods} tag="li" class={rootClassName} bind:ref onclick={handleClick}>
	{#if prefix}<div class="atmr-list-item__prefix"><Slot content={prefix} /></div>{/if}
	<div class="atmr-list-item__content">{@render children?.()}</div>
	{#if suffix}<div class="atmr-list-item__suffix"><Slot content={suffix} /></div>{/if}
</Box>
