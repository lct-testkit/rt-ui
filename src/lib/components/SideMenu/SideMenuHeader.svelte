<script lang="ts">
	// Port of packages/sidemenu/src/react/SideMenuHeader.tsx
	// DOM: <div class="atmr-box atmr-side-menu__header" ...>children</div>
	import clsx from 'clsx';
	import type { ComponentProps, Snippet } from 'svelte';
	import Box from '../Box/Box.svelte';
	import { boxWithMods } from '../../utils/boxMods.js';

	type BoxProps = ComponentProps<typeof Box>;

	export interface SideMenuHeaderProps extends Omit<BoxProps, 'children' | 'tag' | 'ref'> {
		children?: Snippet;
		/** Корневой элемент (аналог forwardRef) */
		ref?: HTMLElement | null;
		[key: string]: unknown;
	}

	let { children, class: className, ref = $bindable(null), ...boxProps }: SideMenuHeaderProps = $props();

	const boxPropsWithMods = $derived(boxWithMods(boxProps, []));
	const rootClassName = $derived(clsx('atmr-side-menu__header', className));
</script>

<Box {...boxPropsWithMods} tag="div" class={rootClassName} bind:ref>{@render children?.()}</Box>
