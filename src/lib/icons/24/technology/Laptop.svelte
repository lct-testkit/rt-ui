<script lang="ts">
	import Base from '../../Icon.svelte';
	let props: Record<string, any> = $props();
</script>

<Base {...props}>
	<path fill-rule="evenodd" clip-rule="evenodd" d="M19.5 8V15C19.5 15.8284 18.8284 16.5 18 16.5L6 16.5C5.17157 16.5 4.5 15.8284 4.5 15L4.5 8C4.5 7.17157 5.17157 6.5 6 6.5L18 6.5C18.8284 6.5 19.5 7.17157 19.5 8ZM18 5C19.6569 5 21 6.34315 21 8V15C21 16.6569 19.6569 18 18 18L6 18C4.34314 18 3 16.6569 3 15L3 8C3 6.34315 4.34315 5 6 5H18ZM2 20H22V18.5H2V20Z" />
</Base>
