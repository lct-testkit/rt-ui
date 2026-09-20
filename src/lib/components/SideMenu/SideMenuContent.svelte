<script lang="ts">
	// Port of packages/sidemenu/src/react/SideMenuContent.tsx
	// DOM: <div class="atmr-side-menu__content">children</div>  (React ignores every prop except children / className)
	import clsx from 'clsx';
	import type { Snippet } from 'svelte';

	export interface SideMenuContentProps {
		children?: Snippet;
		class?: string;
		/** Корневой элемент (аналог forwardRef) */
		ref?: HTMLDivElement | null;
	}

	let { children, class: className, ref = $bindable(null) }: SideMenuContentProps = $props();
</script>

<div class={clsx('atmr-side-menu__content', className)} bind:this={ref}>{@render children?.()}</div>
