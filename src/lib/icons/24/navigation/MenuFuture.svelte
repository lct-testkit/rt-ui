<script lang="ts">
	import Base from '../../Icon.svelte';
	let props: Record<string, any> = $props();
</script>

<Base {...props}>
	<path fill-rule="evenodd" clip-rule="evenodd" d="M3.5 6C2.67157 6 2 6.67157 2 7.5V8.5C2 9.32843 2.67157 10 3.5 10H20.5C21.3284 10 22 9.32843 22 8.5V7.5C22 6.67157 21.3284 6 20.5 6H3.5ZM3.5 14C2.67157 14 2 14.6716 2 15.5V16.5C2 17.3284 2.67157 18 3.5 18H16.5C17.3284 18 18 17.3284 18 16.5V15.5C18 14.6716 17.3284 14 16.5 14H3.5Z" />
</Base>
