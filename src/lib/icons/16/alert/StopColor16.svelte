<script lang="ts">
	import Base from '../../IconStatic16.svelte';
	let props: Record<string, any> = $props();
	const fill = $derived(props.fill === undefined ? ("var(--atmr-error-hover)") : props.fill);
	const secondaryColor = $derived(props.secondaryColor === undefined ? ("var(--atmr-error-on-error)") : props.secondaryColor);
</script>

<Base {...props}>
	<path fill-rule="evenodd" clip-rule="evenodd" d="M15 8C15 11.866 11.866 15 8 15C4.13401 15 1 11.866 1 8C1 4.13401 4.13401 1 8 1C11.866 1 15 4.13401 15 8Z" {fill} />
	<path fill-rule="evenodd" clip-rule="evenodd" d="M5.03026 3.96973L12.0303 10.9696L10.9696 12.0303L3.9696 5.03039L5.03026 3.96973Z" fill={secondaryColor} />
</Base>
