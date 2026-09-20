<script lang="ts">
	// Port of packages/icons IconStatic16 (fixed 16px).
	import type { Snippet } from 'svelte';
	import type { SVGAttributes } from 'svelte/elements';

	interface Props extends Omit<SVGAttributes<SVGSVGElement>, 'children'> {
		fill?: string;
		children?: Snippet;
	}

	let { children, class: className, fill, style, ...rest }: Props = $props();

	const iconClass = $derived(`atmr-icon ${className || ''}`.trim());
	const iconStyle = $derived([fill != null ? `fill: ${fill};` : '', style ?? ''].filter(Boolean).join(' ') || undefined);
</script>

<svg
	class={iconClass}
	width="16"
	height="16"
	viewBox="0 0 16 16"
	aria-hidden="true"
	xmlns="http://www.w3.org/2000/svg"
	style={iconStyle}
	{...rest}
>{@render children?.()}</svg>
