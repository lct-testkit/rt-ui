<script lang="ts">
	import Base from '../../Icon.svelte';
	let props: Record<string, any> = $props();
	const fill = $derived(props.fill === undefined ? ("var(--atmr-error-soft)") : props.fill);
	const secondaryColor = $derived(props.secondaryColor === undefined ? ("var(--atmr-error-on-error)") : props.secondaryColor);
</script>

<Base {...props}>
	<path fill-rule="evenodd" clip-rule="evenodd" d="M6 2L13.4737 2C13.9944 2 14.4946 2.20306 14.8679 2.56601L19.3942 6.96654C19.7815 7.3431 20 7.86033 20 8.40053L20 20C20 21.1046 19.1046 22 18 22L6 22C4.89543 22 4 21.1046 4 20L4 4C4 2.89543 4.89543 2 6 2Z" {fill} />
	<path fill-rule="evenodd" clip-rule="evenodd" d="M9.70097 16.3598L12.0005 14.0602L14.2993 16.3589L15.3587 15.297L13.0612 12.9996L15.3579 10.7029L14.2985 9.64099L12.0005 11.9389L9.70172 9.6402L8.64236 10.7022L10.9399 12.9996L8.6416 15.2978L9.70097 16.3598Z" fill={secondaryColor} />
</Base>
