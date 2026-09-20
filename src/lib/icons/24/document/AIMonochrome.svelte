<script lang="ts">
	import Base from '../../Icon.svelte';
	let props: Record<string, any> = $props();
	const fill = $derived(props.fill === undefined ? ("var(--atmr-accent-container-default)") : props.fill);
	const secondaryColor = $derived(props.secondaryColor === undefined ? ("var(--atmr-accent-on-container)") : props.secondaryColor);
</script>

<Base {...props}>
	<path fill-rule="evenodd" clip-rule="evenodd" d="M4 2C2.89543 2 2 2.89543 2 4L2 20C2 21.1046 2.89543 22 4 22L16 22C16.7571 22 17.4159 21.5793 17.7555 20.959C18.0207 20.4745 17.5523 20 17 20L5.25 20C4.55964 20 4 19.4404 4 18.75L4 15.25C4 14.5596 4.55964 14 5.25 14L17 14C17.5523 14 18 13.5523 18 13L18 7.3558C18 6.80924 17.7763 6.28648 17.381 5.90909L13.8653 2.55329C13.4933 2.19815 12.9987 2 12.4844 2L4 2Z" {fill} />
	<path fill-rule="evenodd" clip-rule="evenodd" d="M8.29374 10L10.7035 10L12.4973 18L10.96 18L10.5136 16.009L8.48365 16.009L8.03724 18L6.5 18L8.29374 10ZM9.49864 11.4822L10.1773 14.509L8.81998 14.509L9.49864 11.4822ZM18 10.0095L13.5 10.0095L13.5 11.5095L15.0202 11.5095L15.0202 16.5117L13.5 16.5117L13.5 18.0117L18 18.0117L18 16.5117L16.5202 16.5117L16.5202 11.5095L18 11.5095L18 10.0095Z" fill={secondaryColor} />
</Base>
