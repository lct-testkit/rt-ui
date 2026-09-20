<script lang="ts">
	import Base from '../../IconStatic16.svelte';
	let props: Record<string, any> = $props();
	const fill = $derived(props.fill === undefined ? ("var(--atmr-error-container-hover)") : props.fill);
	const secondaryColor = $derived(props.secondaryColor === undefined ? ("var(--atmr-error-hover)") : props.secondaryColor);
</script>

<Base {...props}>
	<path fill-rule="evenodd" clip-rule="evenodd" d="M15 8C15 11.866 11.866 15 8 15C4.13401 15 1 11.866 1 8C1 4.13401 4.13401 1 8 1C11.866 1 15 4.13401 15 8Z" {fill} />
	<path fill-rule="evenodd" clip-rule="evenodd" d="M5.03027 3.96967L12.0303 10.9697L10.9696 12.0304L3.9696 5.03032L5.03027 3.96967Z" fill={secondaryColor} />
</Base>
