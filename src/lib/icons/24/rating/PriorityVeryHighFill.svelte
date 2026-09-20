<script lang="ts">
	import Base from '../../Icon.svelte';
	let props: Record<string, any> = $props();
	const fill = $derived(props.fill === undefined ? ("var(--atmr-error-default)") : props.fill);
</script>

<Base {...props}>
	<path {fill} d="M20 18.9937V10.4258C20 9.4362 19.512 8.51028 18.6956 7.95095L13.6956 4.52517C12.6737 3.82494 11.3263 3.82494 10.3044 4.52517L5.30435 7.95095C4.48801 8.51028 4 9.4362 4 10.4258V18.9937C4 19.8116 4.92841 20.2836 5.58924 19.8017L10.8215 15.9858C11.5237 15.4737 12.4763 15.4737 13.1785 15.9858L18.4108 19.8017C19.0716 20.2836 20 19.8116 20 18.9937Z" />
</Base>
