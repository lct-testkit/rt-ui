<script lang="ts">
	import Base from '../../IconStatic16.svelte';
	let props: Record<string, any> = $props();
	const fill = $derived(props.fill === undefined ? ("var(--atmr-neutral-muted)") : props.fill);
</script>

<Base {...props}>
	<path {fill} d="M9.2329 7.87137L11.7428 9.83638C12.2533 10.2361 13 9.87234 13 9.22398C13 9.1937 12.9859 9.16515 12.9618 9.14675L9.51848 6.514C8.62215 5.82867 7.37785 5.82867 6.48152 6.51399L3.03817 9.14675C3.01411 9.16515 3 9.1937 3 9.22398C3 9.87234 3.74669 10.2361 4.2572 9.83638L6.7671 7.87137C7.49126 7.30442 8.50874 7.30442 9.2329 7.87137Z" />
</Base>
