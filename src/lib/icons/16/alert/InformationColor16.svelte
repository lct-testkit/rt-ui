<script lang="ts">
	import Base from '../../IconStatic16.svelte';
	let props: Record<string, any> = $props();
	const fill = $derived(props.fill === undefined ? ("var(--atmr-info-soft)") : props.fill);
	const secondaryColor = $derived(props.secondaryColor === undefined ? ("var(--atmr-info-on-info)") : props.secondaryColor);
</script>

<Base {...props}>
	<path d="M15 8C15 11.866 11.866 15 8 15C4.13401 15 1 11.866 1 8C1 4.13401 4.13401 1 8 1C11.866 1 15 4.13401 15 8Z" {fill} />
	<path fill-rule="evenodd" clip-rule="evenodd" d="M8.96593 5.848L7.03393 5.848L7.03394 4L8.96593 4L8.96593 5.848ZM8.50195 7L7 7L7 8.5L7.50196 8.5L7.50196 10.5L7 10.5L7 12L9.5 12L9.5 10.5L9.00195 10.5L9.00195 7.5C9.00195 7.22386 8.7781 7 8.50195 7Z" fill={secondaryColor} />
</Base>
