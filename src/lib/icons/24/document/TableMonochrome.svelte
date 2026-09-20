<script lang="ts">
	import Base from '../../Icon.svelte';
	let props: Record<string, any> = $props();
	const fill = $derived(props.fill === undefined ? ("var(--atmr-success-container-default)") : props.fill);
	const secondaryColor = $derived(props.secondaryColor === undefined ? ("var(--atmr-success-on-container)") : props.secondaryColor);
	const tertiaryColor = $derived(props.tertiaryColor === undefined ? ("var(--atmr-success-muted)") : props.tertiaryColor);
</script>

<Base {...props}>
	<path fill-rule="evenodd" clip-rule="evenodd" d="M4 4C4 2.89543 4.89543 2 6 2L13.4737 2C13.9944 2 14.4946 2.20306 14.8679 2.56601L19.3942 6.96654C19.7815 7.3431 20 7.86033 20 8.40053L20 20C20 21.1046 19.1046 22 18 22L6 22C4.89543 22 4 21.1046 4 20L4 4Z" {fill} />
	<path fill-rule="evenodd" clip-rule="evenodd" d="M7.5 9C7.22386 9 7 9.22386 7 9.5L7 12.25C7 12.5261 7.22386 12.75 7.5 12.75L10 12.75C10.2761 12.75 10.5 12.5261 10.5 12.25L10.5 9.5C10.5 9.22386 10.2761 9 10 9L7.5 9ZM12.5 9C12.2239 9 12 9.22386 12 9.5L12 12.25C12 12.5261 12.2239 12.75 12.5 12.75L16.5 12.75C16.7761 12.75 17 12.5261 17 12.25L17 9.5C17 9.22386 16.7761 9 16.5 9L12.5 9Z" fill={secondaryColor} />
	<path fill-rule="evenodd" clip-rule="evenodd" d="M7.5 14.25C7.22386 14.25 7 14.4739 7 14.75L7 17.5C7 17.7761 7.22386 18 7.5 18L10 18C10.2761 18 10.5 17.7761 10.5 17.5L10.5 14.75C10.5 14.4739 10.2761 14.25 10 14.25L7.5 14.25ZM12.5 14.25C12.2239 14.25 12 14.4739 12 14.75L12 17.5C12 17.7761 12.2239 18 12.5 18L16.5 18C16.7761 18 17 17.7761 17 17.5L17 14.75C17 14.4739 16.7761 14.25 16.5 14.25L12.5 14.25Z" fill={tertiaryColor} />
</Base>
