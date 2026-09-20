<script lang="ts">
	import Base from '../../Icon.svelte';
	let props: Record<string, any> = $props();
</script>

<Base {...props}>
	<path fill-rule="evenodd" clip-rule="evenodd" d="M19 4.5H5C4.17157 4.5 3.5 5.17157 3.5 6V15C3.5 15.8284 4.17157 16.5 5 16.5H19C19.8284 16.5 20.5 15.8284 20.5 15V6C20.5 5.17157 19.8284 4.5 19 4.5ZM5 3C3.34315 3 2 4.34315 2 6V15C2 16.6569 3.34315 18 5 18H11.25L11.25 19.5H8V21H16V19.5H12.75L12.75 18H19C20.6569 18 22 16.6569 22 15V6C22 4.34315 20.6569 3 19 3H5Z" />
</Base>
