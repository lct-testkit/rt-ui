<script lang="ts">
	import Base from '../../Icon.svelte';
	let props: Record<string, any> = $props();
	const fill = $derived(props.fill === undefined ? ("var(--atmr-info-soft)") : props.fill);
	const secondaryColor = $derived(props.secondaryColor === undefined ? ("var(--atmr-info-on-info)") : props.secondaryColor);
</script>

<Base {...props}>
	<path d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" {fill} />
	<path d="M10.5 10H12.502C12.7781 10 13.002 10.2239 13.002 10.5L13.002 15.5H14L14 17H10.5V15.5H11.502L11.502 11.5L10.5 11.5V10Z" fill={secondaryColor} />
	<path d="M11.0339 8.348H12.9659V6.5H11.0339V8.348Z" fill={secondaryColor} />
</Base>
