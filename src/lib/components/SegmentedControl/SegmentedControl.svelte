<script lang="ts">
	// Port of packages/ui-kit/src/components/SegmentedControl/SegmentedControl.tsx
	// Keeps the active segment index (initialised from `value`, re-synced when a truthy `value` changes) and shares it with the
	// Segments through Svelte context.
	import clsx from 'clsx';
	import { untrack, type Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { noop } from '../../utils/noop.js';
	import {
		DEFAULT_SIZE,
		DEFAULT_VARIANT,
		SEGMENTED_CONTROL_SIZES,
		SEGMENTED_CONTROL_VARIANTS,
		type SegmentedControlSize,
		type SegmentedControlVariant
	} from './constants.js';
	import { setSegmentedControlContext } from './context.js';

	export interface SegmentedControlProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onchange'> {
		/** Задаёт вариант для компонента */
		variant?: SegmentedControlVariant;
		/** Размер компонента */
		size?: SegmentedControlSize;
		/** Блокирует все сегменты */
		disabledAll?: boolean;
		/** Индекс активного сегмента */
		value?: string;
		/** Вызывается при выборе другого сегмента (получает index) */
		onChange?: (index: string) => void;
		/** Дочерние элементы компонента */
		children?: Snippet;
	}

	let {
		variant = DEFAULT_VARIANT,
		size = DEFAULT_SIZE,
		disabledAll = false,
		value,
		class: className = '',
		onChange = noop,
		children,
		...restProps
	}: SegmentedControlProps = $props();

	// svelte-ignore state_referenced_locally
	let activeIndex = $state<string | undefined>(value);

	function handleChange(index: string) {
		if (index !== activeIndex) {
			activeIndex = index;
			onChange(index);
		}
	}

	// useEffect(..., [value])
	$effect.pre(() => {
		const next = value;
		untrack(() => {
			if (next && next !== activeIndex) {
				activeIndex = next;
			}
		});
	});

	setSegmentedControlContext({
		get variant() {
			return variant;
		},
		get size() {
			return size;
		},
		get disabledAll() {
			return disabledAll;
		},
		get activeIndex() {
			return activeIndex;
		},
		handleChange
	});

	const rootClass = $derived(
		clsx('atmr-segmentedcontrol', `atmr-segmentedcontrol--${SEGMENTED_CONTROL_VARIANTS[variant]}`, `atmr-segmentedcontrol--size-${SEGMENTED_CONTROL_SIZES[size]}`, className)
	);
</script>

<div class={rootClass} role="radiogroup" {...restProps}>
	{@render children?.()}
</div>
