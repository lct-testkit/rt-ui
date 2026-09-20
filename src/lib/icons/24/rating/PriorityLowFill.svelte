<script lang="ts">
	import Base from '../../Icon.svelte';
	let props: Record<string, any> = $props();
	const fill = $derived(props.fill === undefined ? ("var(--atmr-neutral-muted)") : props.fill);
</script>

<Base {...props}>
	<path {fill} d="M19.6835 14.9249L13.1235 7.50635C12.5264 6.83122 11.4731 6.83122 10.8761 7.50635L4.31604 14.9249C3.60257 15.7317 4.17541 17.0029 5.25244 17.0029H18.7471C19.8241 17.0029 20.397 15.7317 19.6835 14.9249Z" />
</Base>
