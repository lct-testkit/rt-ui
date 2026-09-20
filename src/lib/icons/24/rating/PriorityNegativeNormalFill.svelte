<script lang="ts">
	import Base from '../../Icon.svelte';
	let props: Record<string, any> = $props();
	const fill = $derived(props.fill === undefined ? ("var(--atmr-neutral-default)") : props.fill);
</script>

<Base {...props}>
	<path {fill} d="M20 7.50173V11.2359C20 12.2491 19.4886 13.1939 18.6402 13.7478L13.6402 17.0127C12.6436 17.6634 11.3564 17.6634 10.3598 17.0127L5.3598 13.7478C4.51143 13.1939 4 12.2491 4 11.2359V7.50173C4 6.69423 4.90764 6.21973 5.57072 6.68058L10.8586 10.3558C11.5448 10.8327 12.4552 10.8327 13.1414 10.3558L18.4293 6.68058C19.0924 6.21973 20 6.69423 20 7.50173Z" />
</Base>
