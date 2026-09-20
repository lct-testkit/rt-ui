<script lang="ts">
	import Base from '../../Icon.svelte';
	let props: Record<string, any> = $props();
	const fill = $derived(props.fill === undefined ? ("var(--atmr-error-container-default)") : props.fill);
	const secondaryColor = $derived(props.secondaryColor === undefined ? ("var(--atmr-error-soft)") : props.secondaryColor);
</script>

<Base {...props}>
	<path fill-rule="evenodd" clip-rule="evenodd" d="M6 2L13.4737 2C13.9944 2 14.4946 2.20306 14.8679 2.56601L19.3942 6.96654C19.7815 7.3431 20 7.86033 20 8.40053L20 20C20 21.1046 19.1046 22 18 22L6 22C4.89543 22 4 21.1046 4 20L4 4C4 2.89543 4.89543 2 6 2Z" {fill} />
	<path fill-rule="evenodd" clip-rule="evenodd" d="M12 19C15.3135 19 18 16.3137 18 13C18 9.68628 15.3135 7 12 7C8.68652 7 6 9.68628 6 13C6 16.3137 8.68652 19 12 19ZM10 9.99719L12 12L14 9.99719L15 11L13.0005 13.0001L15 15.0093L14.0093 16L12 14L10 16.0001L9 15.0093L11 13.0001L9 11L10 9.99719Z" fill={secondaryColor} />
</Base>
