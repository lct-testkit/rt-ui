<script lang="ts">
	import Base from '../../Icon.svelte';
	let props: Record<string, any> = $props();
</script>

<Base {...props}>
	<path fill-rule="evenodd" clip-rule="evenodd" d="M8 4.5H16C16.8284 4.5 17.5 5.17157 17.5 6V18C17.5 18.8284 16.8284 19.5 16 19.5H8C7.17157 19.5 6.5 18.8284 6.5 18V6C6.5 5.17157 7.17157 4.5 8 4.5ZM5 6C5 4.34315 6.34315 3 8 3H16C17.6569 3 19 4.34315 19 6V18C19 19.6569 17.6569 21 16 21H8C6.34315 21 5 19.6569 5 18V6ZM13 16.5H11V18H13V16.5Z" />
</Base>
