<script lang="ts">
	// Port of packages/sidemenu/src/react/SideMenuFooter.tsx
	// DOM: <div class="atmr-side-menu__footer">children</div>  (React ignores every prop except children / className)
	import clsx from 'clsx';
	import type { Snippet } from 'svelte';

	export interface SideMenuFooterProps {
		children?: Snippet;
		class?: string;
		/** Корневой элемент (аналог forwardRef) */
		ref?: HTMLDivElement | null;
	}

	let { children, class: className, ref = $bindable(null) }: SideMenuFooterProps = $props();
</script>

<div class={clsx('atmr-side-menu__footer', className)} bind:this={ref}>{@render children?.()}</div>
