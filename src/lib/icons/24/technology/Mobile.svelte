<script lang="ts">
	import Base from '../../Icon.svelte';
	let props: Record<string, any> = $props();
</script>

<Base {...props}>
	<path fill-rule="evenodd" clip-rule="evenodd" d="M9 4.5H15C15.8284 4.5 16.5 5.17157 16.5 6V18C16.5 18.8284 15.8284 19.5 15 19.5H9C8.17157 19.5 7.5 18.8284 7.5 18V6C7.5 5.17157 8.17157 4.5 9 4.5ZM6 6C6 4.34315 7.34315 3 9 3H15C16.6569 3 18 4.34315 18 6V18C18 19.6569 16.6569 21 15 21H9C7.34315 21 6 19.6569 6 18V6ZM14 16.5H10V18H14V16.5Z" />
</Base>
