<script lang="ts">
	// Port of packages/ui-kit/src/components/Counter/Counter.tsx
	import clsx from 'clsx';
	import Slot from '../../internal/Slot.svelte';
	import type { Content } from '../../internal/types.js';
	import type { CounterColorScheme, CounterSize, CounterVariant } from './constants.js';

	interface Props {
		/** Содержимое счётчика */
		children?: Content;
		/** Вариант */
		variant?: CounterVariant;
		/** Цветовая схема */
		colorScheme?: CounterColorScheme;
		/** Размер */
		size?: CounterSize;
		class?: string;
	}

	// like the React component, only these props are used (no rest props are spread on the root)
	let { children, variant = 'primary', colorScheme = 'accent', size = 's', class: className }: Props = $props();

	const rootClass = $derived(clsx('atmr-counter', `atmr-counter--${variant}`, `atmr-counter--${colorScheme}`, `atmr-counter--size-${size}`, className));
</script>

<div class={rootClass} data-testid="counter"><span><Slot content={children} /></span></div>
