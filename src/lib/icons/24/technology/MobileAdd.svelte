<script lang="ts">
	import Base from '../../Icon.svelte';
	let props: Record<string, any> = $props();
</script>

<Base {...props}>
	<path fill-rule="evenodd" clip-rule="evenodd" d="M9 4.5H15C15.8284 4.5 16.5 5.17157 16.5 6V14H18V6C18 4.34315 16.6569 3 15 3H9C7.34315 3 6 4.34315 6 6V18C6 19.6569 7.34315 21 9 21H14V19.5H9C8.17157 19.5 7.5 18.8284 7.5 18V6C7.5 5.17157 8.17157 4.5 9 4.5ZM10 16.5H14V18H10V16.5ZM18.75 21.5V19.25H16.5V17.75H18.75V15.5H20.25V17.75H22.5V19.25H20.25V21.5H18.75Z" />
</Base>
