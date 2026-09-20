<script lang="ts">
	import Base from '../../Icon.svelte';
	let props: Record<string, any> = $props();
	const fill = $derived(props.fill === undefined ? ("var(--atmr-status-03-default)") : props.fill);
	const secondaryColor = $derived(props.secondaryColor === undefined ? ("var(--atmr-status-03-on-status-03)") : props.secondaryColor);
	const tertiaryColor = $derived(props.tertiaryColor === undefined ? ("var(--atmr-status-03-muted)") : props.tertiaryColor);
</script>

<Base {...props}>
	<path fill-rule="evenodd" clip-rule="evenodd" d="M4 4C4 2.89543 4.89543 2 6 2L13.4737 2C13.9944 2 14.4946 2.20306 14.8679 2.56601L19.3942 6.96654C19.7815 7.3431 20 7.86033 20 8.40053L20 20C20 21.1046 19.1046 22 18 22L6 22C4.89543 22 4 21.1046 4 20L4 4Z" {fill} />
	<path fill-rule="evenodd" clip-rule="evenodd" d="M13 10.5C13 9.67157 13.6716 9 14.5 9C15.3284 9 16 9.67157 16 10.5C16 11.3284 15.3284 12 14.5 12C13.6716 12 13 11.3284 13 10.5Z" fill={secondaryColor} />
	<path fill-rule="evenodd" clip-rule="evenodd" d="M15.6086 15.2742L19.647 18.7005C19.8709 18.8905 20 19.1694 20 19.463L20 20.0001C20 21.1046 19.1046 22.0001 18 22.0001L6 22.0001C4.89543 22.0001 4 21.1046 4 20.0001L4 15.4368C4 15.1584 4.11613 14.8925 4.32043 14.7032L6.86119 12.3496C7.22739 12.0104 7.78766 11.9932 8.174 12.3093L12.3936 15.7617C12.7497 16.0531 13.2587 16.0638 13.6268 15.7878L14.3616 15.2367C14.735 14.9566 15.2526 14.9722 15.6086 15.2742Z" fill={tertiaryColor} />
</Base>
