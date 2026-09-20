<script lang="ts">
	import Base from '../../Icon.svelte';
	let props: Record<string, any> = $props();
	const fill = $derived(props.fill === undefined ? ("var(--atmr-neutral-container-default)") : props.fill);
	const secondaryColor = $derived(props.secondaryColor === undefined ? ("var(--atmr-neutral-on-container)") : props.secondaryColor);
</script>

<Base {...props}>
	<path fill-rule="evenodd" clip-rule="evenodd" d="M4 2C2.89543 2 2 2.89543 2 4L2 20C2 21.1046 2.89543 22 4 22L16 22C16.7571 22 17.4159 21.5793 17.7555 20.959C18.0207 20.4745 17.5523 20 17 20L5.25 20C4.55964 20 4 19.4404 4 18.75L4 15.25C4 14.5596 4.55964 14 5.25 14L17 14C17.5523 14 18 13.5523 18 13L18 7.3558C18 6.80924 17.7763 6.28648 17.381 5.90909L13.8653 2.55329C13.4933 2.19815 12.9987 2 12.4844 2L4 2Z" {fill} />
	<path fill-rule="evenodd" clip-rule="evenodd" d="M16.4974 10L14.8693 10L13.9953 12.0711L13.1213 10L11.4932 10L13.1812 14L11.4932 18L13.1213 18L13.9953 15.929L14.8693 18L16.4974 18L14.8093 14L16.4974 10ZM10.5039 10.0022L6 10.0022L6 11.5022L7.50195 11.5022L7.50195 18.0001L9.00195 18.0001L9.00195 11.5022L10.5039 11.5022L10.5039 10.0022ZM21.9978 10.0022L17.4939 10.0022L17.4939 11.5022L18.9958 11.5022L18.9958 18.0001L20.4958 18.0001L20.4958 11.5022L21.9978 11.5022L21.9978 10.0022Z" fill={secondaryColor} />
</Base>
