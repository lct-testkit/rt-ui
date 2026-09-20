<script lang="ts">
	import Base from '../../Icon.svelte';
	let props: Record<string, any> = $props();
</script>

<Base {...props}>
	<path fill-rule="evenodd" clip-rule="evenodd" d="M20 5H4V6.55556H20V5ZM7 9.22222H17V10.7778H7V9.22222Z" />
	{","}
	<path d="M17 17.4444H7V19H17V17.4444Z" />
	{","}
	<path d="M20 13.4444H4V15H20V13.4444Z" />
</Base>
