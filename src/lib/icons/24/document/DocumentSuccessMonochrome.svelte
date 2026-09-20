<script lang="ts">
	import Base from '../../Icon.svelte';
	let props: Record<string, any> = $props();
	const fill = $derived(props.fill === undefined ? ("var(--atmr-success-container-default)") : props.fill);
	const secondaryColor = $derived(props.secondaryColor === undefined ? ("var(--atmr-success-soft)") : props.secondaryColor);
</script>

<Base {...props}>
	<path fill-rule="evenodd" clip-rule="evenodd" d="M6 2L13.4737 2C13.9944 2 14.4946 2.20306 14.8679 2.56601L19.3942 6.96654C19.7815 7.3431 20 7.86033 20 8.40053L20 20C20 21.1046 19.1046 22 18 22L6 22C4.89543 22 4 21.1046 4 20L4 4C4 2.89543 4.89543 2 6 2Z" {fill} />
	<path fill-rule="evenodd" clip-rule="evenodd" d="M12 19C15.3135 19 18 16.3137 18 13C18 9.68628 15.3135 7 12 7C8.68652 7 6 9.68628 6 13C6 16.3137 8.68652 19 12 19ZM9.49951 12.5L11 14L14.5 10.25L15.5 11.25L11.5303 15.5303C11.3838 15.6768 11.207 15.75 11 15.75C10.793 15.75 10.6162 15.6768 10.4697 15.5303L8.5 13.5L9.49951 12.5Z" fill={secondaryColor} />
</Base>
