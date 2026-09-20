<script lang="ts">
	// Port of packages/ui-kit/src/components/Counter/CounterWrapper.tsx
	import clsx from 'clsx';
	import type { Snippet } from 'svelte';
	import type { Content } from '../../internal/types.js';
	import { styleToString } from '../../utils/style.js';
	import Counter from './Counter.svelte';
	import type { CounterSize } from './constants.js';

	interface Props {
		/** Обёрнутое содержимое, к которому «прикрепляется» счётчик */
		children?: Snippet;
		/** Размер счётчика */
		size?: CounterSize;
		class?: string;
		/** Содержимое счётчика */
		content?: Content;
		/** Значение CSS-переменной --right */
		horizontal?: string;
		/** Значение CSS-переменной --top */
		vertical?: string;
	}

	let { children, size = 's', class: className, content, horizontal, vertical }: Props = $props();

	const rootClass = $derived(clsx('counter-wrapper', className));
	const contentStyle = $derived(styleToString({ ...(horizontal && { '--right': horizontal }), ...(vertical && { '--top': vertical }) }));
</script>

<div class={rootClass}>
	{@render children?.()}
	<div class="counter-content" style={contentStyle}>
		<Counter variant="onBackground" colorScheme="accent" {size} children={content} />
	</div>
</div>
