<script lang="ts">
	import Base from '../../Icon.svelte';
	let props: Record<string, any> = $props();
	const fill = $derived(props.fill === undefined ? ("var(--atmr-status-03-container-default)") : props.fill);
	const secondaryColor = $derived(props.secondaryColor === undefined ? ("var(--atmr-status-03-on-container)") : props.secondaryColor);
</script>

<Base {...props}>
	<path d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" {fill} />
	<path fill-rule="evenodd" clip-rule="evenodd" d="M11.25 11.665V7.03125H12.75V11.665C12.75 11.9992 12.8838 12.3195 13.1216 12.5543L15.0271 14.4365L13.9729 15.5037L12.0675 13.6215C11.5444 13.1048 11.25 12.4002 11.25 11.665Z" fill={secondaryColor} />
</Base>
