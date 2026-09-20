<script lang="ts">
	// Port of packages/sidemenu/src/react/SideMenuDivider.tsx
	// DOM: <div class="atmr-side-menu__divider"></div>
	import clsx from 'clsx';

	export interface SideMenuDividerProps {
		class?: string;
		/** Корневой элемент (аналог forwardRef) */
		ref?: HTMLDivElement | null;
	}

	let { class: className, ref = $bindable(null) }: SideMenuDividerProps = $props();
</script>

<div class={clsx('atmr-side-menu__divider', className)} bind:this={ref}></div>
