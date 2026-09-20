<script lang="ts">
	import Base from '../../Icon.svelte';
	let props: Record<string, any> = $props();
</script>

<Base {...props}>
	<path fill-rule="evenodd" clip-rule="evenodd" d="M6 6.5H18C18.8284 6.5 19.5 7.17157 19.5 8V9H4.5V8C4.5 7.17157 5.17157 6.5 6 6.5ZM4.5 10.5V16C4.5 16.8284 5.17157 17.5 6 17.5H18C18.8284 17.5 19.5 16.8284 19.5 16V10.5H4.5ZM3 8C3 6.34315 4.34315 5 6 5H18C19.6569 5 21 6.34315 21 8V16C21 17.6569 19.6569 19 18 19H6C4.34315 19 3 17.6569 3 16V8Z" />
</Base>
