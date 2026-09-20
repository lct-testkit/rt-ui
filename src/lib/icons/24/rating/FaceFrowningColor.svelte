<script lang="ts">
	import Base from '../../Icon.svelte';
	let props: Record<string, any> = $props();
	const fill = $derived(props.fill === undefined ? ("var(--atmr-static-black)") : props.fill);
	const secondaryColor = $derived(props.secondaryColor === undefined ? ("var(--atmr-warning-default)") : props.secondaryColor);
</script>

<Base {...props}>
	<path d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" fill={secondaryColor} />
	<path {fill} fill-rule="evenodd" clip-rule="evenodd" d="M10.009 10.5031C10.009 11.3333 9.33544 12.0063 8.50452 12.0063C7.6736 12.0063 7 11.3333 7 10.5031C7 9.67298 7.6736 9 8.50452 9C9.33544 9 10.009 9.67298 10.009 10.5031ZM15.4301 17.4876C13.7321 15.5029 10.2658 15.5192 8.56819 17.4895L7.43181 16.5105C9.72167 13.8527 14.2671 13.8208 16.5699 16.5124L15.4301 17.4876ZM15.5045 12.0063C16.3354 12.0063 17.009 11.3333 17.009 10.5031C17.009 9.67298 16.3354 9 15.5045 9C14.6736 9 14 9.67298 14 10.5031C14 11.3333 14.6736 12.0063 15.5045 12.0063Z" />
</Base>
