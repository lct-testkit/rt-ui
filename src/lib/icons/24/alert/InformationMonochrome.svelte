<script lang="ts">
	import Base from '../../Icon.svelte';
	let props: Record<string, any> = $props();
	const fill = $derived(props.fill === undefined ? ("var(--atmr-info-container-default)") : props.fill);
	const secondaryColor = $derived(props.secondaryColor === undefined ? ("var(--atmr-info-on-container)") : props.secondaryColor);
</script>

<Base {...props}>
	<path d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" {fill} />
	<path d="M12.9659 8.348H11.0339V6.5H12.9659V8.348Z" fill={secondaryColor} />
	<path d="M12.502 10H10.5V11.5L11.502 11.5L11.502 15.5H10.5V17H14L14 15.5H13.002L13.002 10.5C13.002 10.2239 12.7781 10 12.502 10Z" fill={secondaryColor} />
</Base>
