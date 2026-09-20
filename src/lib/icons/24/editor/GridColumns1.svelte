<script lang="ts">
	import Base from '../../Icon.svelte';
	let props: Record<string, any> = $props();
</script>

<Base {...props}>
	<path fill-rule="evenodd" clip-rule="evenodd" d="M6 4.5H18C18.8284 4.5 19.5 5.17157 19.5 6V7.75H4.5V6C4.5 5.17157 5.17157 4.5 6 4.5ZM4.5 9.25V18C4.5 18.8284 5.17157 19.5 6 19.5H18C18.8284 19.5 19.5 18.8284 19.5 18V9.25H4.5ZM21 9.25V18C21 19.6569 19.6569 21 18 21H6C4.34315 21 3 19.6569 3 18V6C3 4.34315 4.34315 3 6 3H18C19.6569 3 21 4.34315 21 6V7.75V9.25Z" />
</Base>
