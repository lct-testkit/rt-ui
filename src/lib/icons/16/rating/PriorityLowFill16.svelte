<script lang="ts">
	import Base from '../../IconStatic16.svelte';
	let props: Record<string, any> = $props();
	const fill = $derived(props.fill === undefined ? ("var(--atmr-neutral-muted)") : props.fill);
</script>

<Base {...props}>
	<path {fill} d="M12.7934 9.73833L8.54521 5.23533C8.2492 4.92156 7.75015 4.92156 7.45413 5.23533L3.20595 9.73833C2.75462 10.2167 3.09379 11.003 3.75149 11.003H12.2479C12.9056 11.003 13.2447 10.2167 12.7934 9.73833Z" />
</Base>
