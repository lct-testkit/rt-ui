<script lang="ts">
	import Base from '../../IconStatic16.svelte';
	let props: Record<string, any> = $props();
	const fill = $derived(props.fill === undefined ? ("var(--atmr-accent-container-default)") : props.fill);
	const secondaryColor = $derived(props.secondaryColor === undefined ? ("var(--atmr-accent-on-container)") : props.secondaryColor);
</script>

<Base {...props}>
	<path d="M15 8C15 11.866 11.866 15 8 15C4.13401 15 1 11.866 1 8C1 4.13401 4.13401 1 8 1C11.866 1 15 4.13401 15 8Z" {fill} />
	<path fill-rule="evenodd" clip-rule="evenodd" d="M8.79806 9.5H7.19806V9.42969C7.19806 8.74622 7.50056 8.25585 8.24005 7.66202C8.97954 7.06819 9.29633 6.80109 9.29633 6.22967C9.29633 5.64704 8.73421 5.33203 8.13108 5.33203C7.52795 5.33203 6.89575 5.67446 6.89575 6.36913C6.89575 6.51479 6.94904 6.74166 6.99386 6.8537L5.6746 7.14C5.57376 6.92712 5.46997 6.59941 5.46997 6.26328C5.46997 5.14284 6.49524 4 8.09747 4C9.7221 4 10.7363 4.86274 10.7363 6.12883C10.7363 7.02517 10.4879 7.49291 9.36751 8.45648C8.96416 8.80382 8.79806 9.00701 8.79806 9.5ZM8.79806 11.9999H7.19806V10.4H8.79806V11.9999Z" fill={secondaryColor} />
</Base>
