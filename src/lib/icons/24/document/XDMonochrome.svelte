<script lang="ts">
	import Base from '../../Icon.svelte';
	let props: Record<string, any> = $props();
	const fill = $derived(props.fill === undefined ? ("var(--atmr-status-01-container-default)") : props.fill);
	const secondaryColor = $derived(props.secondaryColor === undefined ? ("var(--atmr-status-01-on-container)") : props.secondaryColor);
</script>

<Base {...props}>
	<path fill-rule="evenodd" clip-rule="evenodd" d="M4 2C2.89543 2 2 2.89543 2 4L2 20C2 21.1046 2.89543 22 4 22L16 22C16.7571 22 17.4159 21.5793 17.7555 20.959C18.0207 20.4745 17.5523 20 17 20L5.25 20C4.55964 20 4 19.4404 4 18.75L4 15.25C4 14.5596 4.55964 14 5.25 14L17 14C17.5523 14 18 13.5523 18 13L18 7.3558C18 6.80924 17.7763 6.28648 17.381 5.90909L13.8653 2.55329C13.4933 2.19815 12.9987 2 12.4844 2L4 2Z" {fill} />
	<path fill-rule="evenodd" clip-rule="evenodd" d="M11.4974 10L9.86931 10L8.99529 12.0711L8.12127 10L6.49316 10L8.18124 14L6.49319 18L8.12129 18L8.99529 15.929L9.86928 18L11.4974 18L9.80934 14L11.4974 10ZM13.9932 11.5L15.2432 11.5C15.9335 11.5 16.4932 12.0596 16.4932 12.75L16.4932 15.25C16.4932 15.9404 15.9335 16.5 15.2432 16.5L13.9932 16.5L13.9932 11.5ZM12.4932 10L13.9932 10L15.2432 10C16.7619 10 17.9932 11.2312 17.9932 12.75L17.9932 15.25C17.9932 16.7688 16.7619 18 15.2432 18L13.9932 18L12.4932 18L12.4932 16.5L12.4932 11.5L12.4932 10Z" fill={secondaryColor} />
</Base>
