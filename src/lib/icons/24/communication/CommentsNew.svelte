<script lang="ts">
	import Base from '../../Icon.svelte';
	let props: Record<string, any> = $props();
	const fill = $derived(props.fill);
	const secondaryColor = $derived(props.secondaryColor === undefined ? (props.secondaryColor || "#D91528") : props.secondaryColor);
</script>

<Base {...props}>
	<path {fill} fill-rule="evenodd" clip-rule="evenodd" d="M16.5662 16.6668C16.3536 16.5572 16.118 16.5 15.8788 16.5L8 16.5C6.067 16.5 4.5 14.933 4.5 13L4.5 7C4.5 6.17157 5.17157 5.5 6 5.5L18 5.5C18.8284 5.5 19.5 6.17157 19.5 7L19.5 16L19.5 18L19.5 18.1795L16.5662 16.6668ZM6 4C4.34315 4 3 5.34315 3 7L3 13C3 15.7614 5.23858 18 8 18L15.8788 18L19.5417 19.8887C20.2073 20.2319 21 19.7487 21 18.9999L21 18L21 16L21 7C21 5.34315 19.6569 4 18 4L6 4ZM16 12.25L8 12.25L8 13.75L16 13.75L16 12.25ZM14 8.25L8 8.25L8 9.75L14 9.75L14 8.25Z" />
	<path fill={secondaryColor} d="M24 6C24 8.20914 22.2091 10 20 10C17.7909 10 16 8.20914 16 6C16 3.79086 17.7909 2 20 2C22.2091 2 24 3.79086 24 6Z" />
</Base>
