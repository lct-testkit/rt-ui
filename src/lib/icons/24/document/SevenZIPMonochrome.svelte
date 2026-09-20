<script lang="ts">
	import Base from '../../Icon.svelte';
	let props: Record<string, any> = $props();
	const fill = $derived(props.fill === undefined ? ("var(--atmr-warning-container-default)") : props.fill);
	const secondaryColor = $derived(props.secondaryColor === undefined ? ("var(--atmr-warning-on-container)") : props.secondaryColor);
</script>

<Base {...props}>
	<path fill-rule="evenodd" clip-rule="evenodd" d="M4 2C2.89543 2 2 2.89543 2 4L2 20C2 21.1046 2.89543 22 4 22L16 22C16.7571 22 17.4159 21.5793 17.7555 20.959C18.0207 20.4745 17.5523 20 17 20L5.25 20C4.55964 20 4 19.4404 4 18.75L4 15.25C4 14.5596 4.55964 14 5.25 14L17 14C17.5523 14 18 13.5523 18 13L18 7.3558C18 6.80924 17.7763 6.28648 17.381 5.90909L13.8653 2.55329C13.4933 2.19815 12.9987 2 12.4844 2L4 2Z" {fill} />
	<path fill-rule="evenodd" clip-rule="evenodd" d="M13 10L13 11.5L16.1989 11.5L13 16.4569L13 18.0013L13.3799 18.0013L18.0022 18.0013L18.0021 16.5013L14.7566 16.5013L18.0022 11.472L18.0022 10L17.5755 10L13 10ZM12.0541 10.3357L9.25746 17.9998L7.66072 17.9998L10.0325 11.5L7 11.4998L7 10L11.8192 10C11.9928 10 12.1136 10.1726 12.0541 10.3357Z" fill={secondaryColor} />
</Base>
