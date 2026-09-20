<script lang="ts">
	import Base from '../../Icon.svelte';
	let props: Record<string, any> = $props();
	const fill = $derived(props.fill === undefined ? ("var(--atmr-error-container-default)") : props.fill);
	const secondaryColor = $derived(props.secondaryColor === undefined ? ("var(--atmr-error-on-container)") : props.secondaryColor);
</script>

<Base {...props}>
	<path d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" {fill} />
	<path fill-rule="evenodd" clip-rule="evenodd" d="M10.9393 12L7.469 15.4703L8.53093 16.5297L11.9999 13.0607L15.469 16.5298L16.531 15.4704L13.0606 12L16.5309 8.52972L15.469 7.47034L11.9999 10.9394L8.53094 7.47035L7.46899 8.52972L10.9393 12Z" fill={secondaryColor} />
</Base>
