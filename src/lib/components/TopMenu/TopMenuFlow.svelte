<script lang="ts">
	// Port of the `TopMenuFlow` part of packages/ui-kit/src/components/TopMenu/TopMenu.tsx
	// A "bubble" that groups containers of the floating menu: `left` (default) | `center` | `right`.
	// DOM: <div class="atmr-box atmr-top-menu-flow-bubble atmr-top-menu-flow-bubble--left|center|right" ...>children</div>
	import clsx from 'clsx';
	import type { ComponentProps, Snippet } from 'svelte';
	import Box from '../Box/Box.svelte';
	import { boxMods, boxWithMods } from '../../utils/boxMods.js';

	type BoxProps = ComponentProps<typeof Box>;

	export interface TopMenuFlowProps extends Omit<BoxProps, 'children' | 'tag' | 'ref'> {
		left?: boolean;
		center?: boolean;
		right?: boolean;
		children?: Snippet;
		/** Корневой элемент (аналог forwardRef) */
		ref?: HTMLElement | null;
		[key: string]: unknown;
	}

	let { children, class: className, left, center, right, ref = $bindable(null), ...boxProps }: TopMenuFlowProps = $props();

	// getFlowPosition
	const position = $derived(left ? 'left' : center ? 'center' : right ? 'right' : 'left');
	const boxPropsWithMods = $derived(boxWithMods(boxProps, boxMods({})));
	const rootClassName = $derived(
		clsx(
			'atmr-top-menu-flow-bubble',
			{
				'atmr-top-menu-flow-bubble--left': position === 'left',
				'atmr-top-menu-flow-bubble--center': position === 'center',
				'atmr-top-menu-flow-bubble--right': position === 'right'
			},
			className
		)
	);
</script>

<Box {...boxPropsWithMods} tag="div" class={rootClassName} bind:ref>{@render children?.()}</Box>
