<script lang="ts">
	// Port of the `TopMenuNavigationContainer` part of packages/ui-kit/src/components/TopMenu/TopMenu.tsx
	// DOM: <div class="atmr-box atmr-top-menu__navigation-container" ...>children</div>
	import clsx from 'clsx';
	import type { ComponentProps, Snippet } from 'svelte';
	import Box from '../Box/Box.svelte';
	import { boxWithMods } from '../../utils/boxMods.js';

	type BoxProps = ComponentProps<typeof Box>;

	export interface TopMenuNavigationContainerProps extends Omit<BoxProps, 'children' | 'tag' | 'ref'> {
		children?: Snippet;
		/** Корневой элемент (аналог forwardRef) */
		ref?: HTMLElement | null;
		[key: string]: unknown;
	}

	let { children, class: className, ref = $bindable(null), ...boxProps }: TopMenuNavigationContainerProps = $props();

	const boxPropsWithMods = $derived(boxWithMods(boxProps, []));
	const rootClassName = $derived(clsx('atmr-top-menu__navigation-container', className));
</script>

<Box {...boxPropsWithMods} tag="div" class={rootClassName} bind:ref>{@render children?.()}</Box>
