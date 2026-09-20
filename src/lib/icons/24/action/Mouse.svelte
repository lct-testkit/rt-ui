<script lang="ts">
	import Base from '../../Icon.svelte';
	let props: Record<string, any> = $props();
</script>

<Base {...props}>
	<path fill-rule="evenodd" clip-rule="evenodd" d="M17.5 9V15C17.5 18.0376 15.0376 20.5 12 20.5C8.96243 20.5 6.5 18.0376 6.5 15V9C6.5 5.96243 8.96243 3.5 12 3.5C15.0376 3.5 17.5 5.96243 17.5 9ZM5 9C5 5.13401 8.13401 2 12 2C15.866 2 19 5.13401 19 9V15C19 18.866 15.866 22 12 22C8.13401 22 5 18.866 5 15V9ZM11.25 6V10H12.75V6H11.25Z" />
</Base>
