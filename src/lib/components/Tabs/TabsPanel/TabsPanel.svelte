<script lang="ts">
	// Port of packages/ui-kit/src/components/Tabs/TabsPanel/TabsPanel.tsx
	// The panel is rendered only while `value === index` (React keeps a `visible` state that an effect sets right after mount; same end state).
	import clsx from 'clsx';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { styleToString, type StyleValue } from '../../../utils/style.js';
	// [ext, not in original] author's motion extension (off by default, see src/lib/ext/README.md)
	import { useMotion, type MotionProp } from '../../../ext/motion.svelte.js';
	import { rtFly, type RtFlyParams } from '../../../ext/transitions.js';

	export interface TabsPanelProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'style'> {
		/** Текущее значение TabsGroup */
		value?: string;
		/** Индекс панели (панель показывается, когда value === index) */
		index?: string;
		/** Содержимое панели */
		children?: Snippet;
		/** Стили корневого элемента (строка или объект как в React) */
		style?: StyleValue;
		/** Корневой элемент (React `forwardRef`) */
		ref?: HTMLDivElement | null;
		/**
		 * [ext, not in original] Svelte-анимация появления панели (fade + небольшой сдвиг вверх, `in:rtFly`). `undefined` — наследуется от `ExtMotionProvider`
		 * (без него выключено = оригинал: панель появляется сразу), `false` — выключено, `true` / `{ duration, easing }` — включено.
		 */
		motion?: MotionProp;
	}

	let { children, value, index, class: className = '', style, ref = $bindable(null), motion, ...restProps }: TabsPanelProps = $props();

	const m = useMotion(() => motion, 'tabs');
	const visible = $derived(value === index);
</script>

{#if visible}
	<div bind:this={ref} role="tabpanel" class={clsx('atmr-tabs-panel', className)} {...restProps} style={styleToString(style)} in:rtFly={m.transition<RtFlyParams>({ y: 8, duration: 's', easing: 'productive-entrance' })}>
		{@render children?.()}
	</div>
{/if}
