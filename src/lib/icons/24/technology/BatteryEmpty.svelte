<script lang="ts">
	import Base from '../../Icon.svelte';
	let props: Record<string, any> = $props();
</script>

<Base {...props}>
	<path fill-rule="evenodd" clip-rule="evenodd" d="M4 8.5H17.5C17.7761 8.5 18 8.72386 18 9V15C18 15.2761 17.7761 15.5 17.5 15.5H4C3.72386 15.5 3.5 15.2761 3.5 15V9C3.5 8.72386 3.72386 8.5 4 8.5ZM2 9C2 7.89543 2.89543 7 4 7H17.5C18.6046 7 19.5 7.89543 19.5 9V15C19.5 16.1046 18.6046 17 17.5 17H4C2.89543 17 2 16.1046 2 15V9ZM21.9807 14V10H20.4807V14H21.9807Z" />
</Base>
