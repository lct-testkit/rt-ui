<script lang="ts">
	import Base from '../../Icon.svelte';
	let props: Record<string, any> = $props();
</script>

<Base {...props}>
	<path fill-rule="evenodd" clip-rule="evenodd" d="M16 4.5H19C19.2761 4.5 19.5 4.72386 19.5 5V8H21V5C21 3.89543 20.1046 3 19 3H16V4.5ZM8 4.5V3H5C3.89543 3 3 3.89543 3 5V8H4.5V5C4.5 4.72386 4.72386 4.5 5 4.5H8ZM4.5 16H3V19C3 20.1046 3.89543 21 5 21H8V19.5H5C4.72386 19.5 4.5 19.2761 4.5 19V16ZM16 19.5V21H19C20.1046 21 21 20.1046 21 19V16H19.5V19C19.5 19.2761 19.2761 19.5 19 19.5H16Z" />
</Base>
