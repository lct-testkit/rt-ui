<script lang="ts">
	import Base from '../../Icon.svelte';
	let props: Record<string, any> = $props();
</script>

<Base {...props}>
	<path fill-rule="evenodd" clip-rule="evenodd" d="M19 4.5H5C4.17157 4.5 3.5 5.17157 3.5 6V15C3.5 15.8284 4.17157 16.5 5 16.5H15V18H12.75L12.75 19.5H15V21H8V19.5H11.25L11.25 18H5C3.34315 18 2 16.6569 2 15V6C2 4.34315 3.34315 3 5 3H19C20.6569 3 22 4.34315 22 6V12H20.5V6C20.5 5.17157 19.8284 4.5 19 4.5ZM19.75 20.5V18.25H17.5V16.75H19.75V14.5H21.25V16.75H23.5V18.25H21.25V20.5H19.75Z" />
</Base>
