<script lang="ts">
	import Base from '../../Icon.svelte';
	let props: Record<string, any> = $props();
	const fill = $derived(props.fill === undefined ? ("var(--atmr-success-soft)") : props.fill);
	const secondaryColor = $derived(props.secondaryColor === undefined ? ("var(--atmr-success-on-success)") : props.secondaryColor);
</script>

<Base {...props}>
	<path fill-rule="evenodd" clip-rule="evenodd" d="M6 2L13.4737 2C13.9944 2 14.4946 2.20306 14.8679 2.56601L19.3942 6.96654C19.7815 7.3431 20 7.86033 20 8.40053L20 20C20 21.1046 19.1046 22 18 22L6 22C4.89543 22 4 21.1046 4 20L4 4C4 2.89543 4.89543 2 6 2Z" {fill} />
	<path fill-rule="evenodd" clip-rule="evenodd" d="M11.5837 15.6032L16.0015 11.1854L14.9408 10.1247L11.0533 14.0122L9.0592 12.018L7.99854 13.0787L10.523 15.6032C10.8159 15.8961 11.2908 15.8961 11.5837 15.6032Z" fill={secondaryColor} />
</Base>
