<script lang="ts">
	import Base from '../../Icon.svelte';
	let props: Record<string, any> = $props();
</script>

<Base {...props}>
	<path fill-rule="evenodd" clip-rule="evenodd" d="M21 5.5H3C2.72386 5.5 2.5 5.72386 2.5 6V18C2.5 18.2761 2.72386 18.5 3 18.5H21C21.2761 18.5 21.5 18.2761 21.5 18V6C21.5 5.72386 21.2761 5.5 21 5.5ZM3 4C1.89543 4 1 4.89543 1 6V18C1 19.1046 1.89543 20 3 20H21C22.1046 20 23 19.1046 23 18V6C23 4.89543 22.1046 4 21 4H3Z" />
</Base>
