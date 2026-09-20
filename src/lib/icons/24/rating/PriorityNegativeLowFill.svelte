<script lang="ts">
	import Base from '../../Icon.svelte';
	let props: Record<string, any> = $props();
	const fill = $derived(props.fill === undefined ? ("var(--atmr-neutral-soft)") : props.fill);
</script>

<Base {...props}>
	<path {fill} d="M19.6839 9.07828L13.1232 16.4903C12.5263 17.1647 11.4738 17.1647 10.8768 16.4903L4.31619 9.07828C3.60215 8.27158 4.17488 6.99979 5.2522 6.99979H18.7479C19.8252 6.99979 20.3979 8.27158 19.6839 9.07828Z" />
</Base>
