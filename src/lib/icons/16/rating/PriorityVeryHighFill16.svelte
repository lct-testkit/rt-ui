<script lang="ts">
	import Base from '../../IconStatic16.svelte';
	let props: Record<string, any> = $props();
	const fill = $derived(props.fill === undefined ? ("var(--atmr-error-default)") : props.fill);
</script>

<Base {...props}>
	<path {fill} d="M13 11.9973V7.67391C13 6.74384 12.5686 5.86636 11.8321 5.29835L9.52678 3.52037C8.62716 2.82655 7.37284 2.82654 6.47323 3.52036L4.16787 5.29835C3.43138 5.86636 3 6.74384 3 7.67391V11.9973C3 12.8444 3.98735 13.3078 4.63897 12.7666L6.72207 11.0362C7.4629 10.4209 8.5371 10.4209 9.27793 11.0362L11.361 12.7666C12.0127 13.3078 13 12.8444 13 11.9973Z" />
</Base>
