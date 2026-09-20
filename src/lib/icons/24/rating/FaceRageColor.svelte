<script lang="ts">
	import Base from '../../Icon.svelte';
	let props: Record<string, any> = $props();
	const fill = $derived(props.fill === undefined ? ("var(--atmr-static-black)") : props.fill);
	const secondaryColor = $derived(props.secondaryColor === undefined ? ("var(--atmr-warning-default)") : props.secondaryColor);
</script>

<Base {...props}>
	<path d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" fill={secondaryColor} />
	<path {fill} fill-rule="evenodd" clip-rule="evenodd" d="M14.0855 10.0024L16.3222 9.24121C16.7356 9.50911 17.009 9.97425 17.009 10.5032C17.009 11.3334 16.3354 12.0063 15.5045 12.0063C14.6736 12.0063 14 11.3334 14 10.5032C14 10.3276 14.0301 10.159 14.0855 10.0024ZM15.4301 17.4876C13.7321 15.5029 10.2658 15.5192 8.56819 17.4895L7.43181 16.5105C9.72167 13.8527 14.2671 13.8208 16.5699 16.5124L15.4301 17.4876ZM7 10.5031C7 9.97551 7.2721 9.51138 7.68374 9.24316L9.92474 10.0058C9.97934 10.1615 10.009 10.3288 10.009 10.5031C10.009 11.3333 9.33544 12.0063 8.50452 12.0063C7.6736 12.0063 7 11.3333 7 10.5031Z" />
</Base>
