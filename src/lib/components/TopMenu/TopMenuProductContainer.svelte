<script lang="ts">
	// Port of the `TopMenuProductContainer` part of packages/ui-kit/src/components/TopMenu/TopMenu.tsx
	// DOM: <div class="atmr-box atmr-top-menu__product-container atmr-top-menu__product-container--align-{align}" data-align="{align}" ...>children</div>
	import clsx from 'clsx';
	import type { ComponentProps, Snippet } from 'svelte';
	import Box from '../Box/Box.svelte';
	import { boxMods, boxWithMods } from '../../utils/boxMods.js';

	type BoxProps = ComponentProps<typeof Box>;

	export interface TopMenuProductContainerProps extends Omit<BoxProps, 'children' | 'tag' | 'ref'> {
		/** Выравнивание содержимого */
		align?: 'left' | 'center' | 'right' | 'stretch';
		children?: Snippet;
		/** Корневой элемент (аналог forwardRef) */
		ref?: HTMLElement | null;
		[key: string]: unknown;
	}

	let { children, class: className, align = 'left', ref = $bindable(null), ...boxProps }: TopMenuProductContainerProps = $props();

	const mods = $derived(boxMods({ 'align-center': align === 'center', 'align-right': align === 'right', 'align-stretch': align === 'stretch' }));
	const boxPropsWithMods = $derived(boxWithMods(boxProps, mods));
	const rootClassName = $derived(
		clsx(
			'atmr-top-menu__product-container',
			{
				'atmr-top-menu__product-container--align-left': align === 'left',
				'atmr-top-menu__product-container--align-center': align === 'center',
				'atmr-top-menu__product-container--align-right': align === 'right',
				'atmr-top-menu__product-container--align-stretch': align === 'stretch'
			},
			className
		)
	);
</script>

<Box {...boxPropsWithMods} tag="div" class={rootClassName} data-align={align} bind:ref>{@render children?.()}</Box>
