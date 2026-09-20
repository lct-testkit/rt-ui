<script lang="ts">
	import Base from '../../Icon.svelte';
	let props: Record<string, any> = $props();
</script>

<Base {...props}>
	<path fill-rule="evenodd" clip-rule="evenodd" d="M20 5H4V6.55556H20V5ZM10 9.22222H20V10.7778H10V9.22222Z" />
	{","}
	<path d="M20 17.4444H10V19H20V17.4444Z" />
	{","}
	<path d="M20 13.5H4V15.0556H20V13.5Z" />
</Base>
