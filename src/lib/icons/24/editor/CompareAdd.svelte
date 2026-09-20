<script lang="ts">
	import Base from '../../Icon.svelte';
	let props: Record<string, any> = $props();
</script>

<Base {...props}>
	<path d="M3.99951 6.25H19.9995V7.75H3.99951V6.25Z" />
	{","}
	<path d="M14.9995 11.25H3.99951V12.75H14.9995V11.25Z" />
	{","}
	<path d="M10.9995 16.25L3.99951 16.25V17.75L10.9995 17.75V16.25Z" />
	{","}
	<path d="M19.7499 20L19.75 17.75L22 17.7499L22 16.2499L19.75 16.25L19.7501 14L18.2501 14L18.25 16.25L16 16.2501L16 17.75L18.25 17.75L18.2499 20L19.7499 20Z" />
</Base>
