<script lang="ts">
	import Base from '../../IconStatic16.svelte';
	let props: Record<string, any> = $props();
	const fill = $derived(props.fill === undefined ? ("var(--atmr-status-03-container-default)") : props.fill);
	const secondaryColor = $derived(props.secondaryColor === undefined ? ("var(--atmr-status-03-on-container)") : props.secondaryColor);
</script>

<Base {...props}>
	<path d="M15 8C15 11.866 11.866 15 8 15C4.13401 15 1 11.866 1 8C1 4.13401 4.13401 1 8 1C11.866 1 15 4.13401 15 8Z" {fill} />
	<path fill-rule="evenodd" clip-rule="evenodd" d="M7 7.7527V4.89648H8.5V7.7527C8.5 8.08688 8.63382 8.40716 8.87157 8.642L9.96456 9.72162L8.91044 10.7888L7.81746 9.70917C7.2944 9.19251 7 8.48791 7 7.7527Z" fill={secondaryColor} />
</Base>
