<script lang="ts">
	import Base from '../../Icon.svelte';
	let props: Record<string, any> = $props();
</script>

<Base {...props}>
	<path d="M4 6.25H20V7.75H4V6.25Z" />
	{","}
	<path d="M15 11.25H4V12.75H15V11.25Z" />
	{","}
	<path d="M11 16.25L4 16.25V17.75L11 17.75V16.25Z" />
	{","}
	<path d="M18.5304 19.0304L22.5304 15.0304L21.4697 13.9697L18 17.4394L16.5301 15.9696L15.4695 17.0303L17.4697 19.0304C17.7626 19.3233 18.2375 19.3233 18.5304 19.0304Z" />
</Base>
