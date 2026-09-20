<script lang="ts">
	// Port of packages/icons Icon (24px, scalable). size <= 1 is a fraction of the parent ("100%").
	import type { Snippet } from 'svelte';
	import type { SVGAttributes } from 'svelte/elements';

	interface Props extends Omit<SVGAttributes<SVGSVGElement>, 'children'> {
		size?: number;
		viewBox?: string;
		fill?: string;
		children?: Snippet;
	}

	let { size = 24, viewBox = '0 0 24 24', children, class: className, fill, style, ...rest }: Props = $props();

	const sizeStr = $derived(size <= 1 ? `${size * 100}%` : size);
	const iconClass = $derived(`atmr-icon ${className || ''}`.trim());
	const iconStyle = $derived([fill != null ? `fill: ${fill};` : '', style ?? ''].filter(Boolean).join(' ') || undefined);
</script>

<svg
	class={iconClass}
	width={sizeStr}
	height={sizeStr}
	{viewBox}
	aria-hidden="true"
	xmlns="http://www.w3.org/2000/svg"
	style={iconStyle}
	{...rest}
>{@render children?.()}</svg>
