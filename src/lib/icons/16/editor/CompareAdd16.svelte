<script lang="ts">
	import Base from '../../IconStatic16.svelte';
	let props: Record<string, any> = $props();
</script>

<Base {...props}>
	<path d="M1 3.25H13V4.75H1V3.25Z" />
	{","}
	<path d="M9 7.25H1V8.75H9V7.25Z" />
	{","}
	<path d="M5 11.25H1V12.75H5V11.25Z" />
	{","}
	<path d="M11.25 15V12.75H9V11.25H11.25V9H12.75V11.25H15V12.75H12.75V15H11.25Z" />
</Base>
