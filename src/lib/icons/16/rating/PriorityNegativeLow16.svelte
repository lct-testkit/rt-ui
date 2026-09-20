<script lang="ts">
	import Base from '../../IconStatic16.svelte';
	let props: Record<string, any> = $props();
	const fill = $derived(props.fill === undefined ? ("var(--atmr-neutral-soft)") : props.fill);
</script>

<Base {...props}>
	<path {fill} d="M9.23183 8.1304L11.744 6.16641C12.2542 5.76747 13 6.13105 13 6.77877C13 6.80906 12.9859 6.83762 12.9618 6.856L9.51713 9.48606C8.62134 10.17 7.37866 10.17 6.48287 9.48606L3.0382 6.856C3.01412 6.83762 3 6.80906 3 6.77877C3 6.13105 3.74576 5.76747 4.25604 6.16641L6.76817 8.1304C7.49192 8.69623 8.50808 8.69623 9.23183 8.1304Z" />
</Base>
