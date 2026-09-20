<script lang="ts">
	import Base from '../../IconStatic16.svelte';
	let props: Record<string, any> = $props();
	const fill = $derived(props.fill === undefined ? ("var(--atmr-success-default)") : props.fill);
</script>

<Base {...props}>
	<path {fill} d="M13 10.9973V8.63047C13 7.72882 12.5945 6.87498 11.8956 6.30525L9.89561 4.67478C8.792 3.77507 7.208 3.77508 6.10439 4.67478L4.10439 6.30525C3.40554 6.87498 3 7.72882 3 8.63047V10.9973C3 11.8573 4.01359 12.3161 4.65981 11.7487L6.68039 9.97452C7.43528 9.31169 8.56472 9.31169 9.31961 9.97452L11.3402 11.7487C11.9864 12.3161 13 11.8573 13 10.9973Z" />
</Base>
