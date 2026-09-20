<script lang="ts">
	import Base from '../../IconStatic16.svelte';
	let props: Record<string, any> = $props();
	const fill = $derived(props.fill === undefined ? ("var(--atmr-neutral-default)") : props.fill);
</script>

<Base {...props}>
	<path {fill} d="M13 5.00199V7.36879C13 8.27045 12.5945 9.12429 11.8956 9.69402L9.89561 11.3245C8.792 12.2242 7.208 12.2242 6.10439 11.3245L4.10439 9.69402C3.40554 9.12429 3 8.27045 3 7.36879V5.00199C3 4.14202 4.01359 3.68314 4.65981 4.25055L6.68039 6.02474C7.43528 6.68758 8.56472 6.68758 9.31961 6.02474L11.3402 4.25055C11.9864 3.68314 13 4.14201 13 5.00199Z" />
</Base>
