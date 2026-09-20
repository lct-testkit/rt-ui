<script lang="ts">
	import Base from '../../Icon.svelte';
	let props: Record<string, any> = $props();
	const fill = $derived(props.fill === undefined ? ("var(--atmr-warning-default)") : props.fill);
	const secondaryColor = $derived(props.secondaryColor === undefined ? ("var(--atmr-warning-muted)") : props.secondaryColor);
	const tertiaryColor = $derived(props.tertiaryColor === undefined ? ("var(--atmr-warning-on-container)") : props.tertiaryColor);
</script>

<Base {...props}>
	<path fill-rule="evenodd" clip-rule="evenodd" d="M4 4C4 2.89543 4.89543 2 6 2L13.4737 2C13.9944 2 14.4946 2.20306 14.8679 2.56601L19.3942 6.96654C19.7815 7.3431 20 7.86033 20 8.40053L20 20C20 21.1046 19.1046 22 18 22L6 22C4.89543 22 4 21.1046 4 20L4 4Z" {fill} />
	<path fill-rule="evenodd" clip-rule="evenodd" d="M17 13C17 15.7614 14.7614 18 12 18C9.23858 18 7 15.7614 7 13C7 10.2386 9.23858 8 12 8C14.7614 8 17 10.2386 17 13Z" fill={secondaryColor} />
	<path fill-rule="evenodd" clip-rule="evenodd" d="M11.0063 8.09872C11.5477 7.98955 11.9999 8.4477 11.9999 8.99999L11.9999 12.6493C11.9999 12.8764 11.9226 13.0967 11.7808 13.274L9.50152 16.1231C9.15635 16.5546 8.51707 16.6294 8.16262 16.2056C7.43684 15.3377 7 14.2198 7 13C7 10.5788 8.72092 8.55956 11.0063 8.09872Z" fill={tertiaryColor} />
</Base>
