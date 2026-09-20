<script lang="ts">
	import Base from '../../IconStatic16.svelte';
	let props: Record<string, any> = $props();
	const fill = $derived(props.fill === undefined ? ("var(--atmr-error-soft)") : props.fill);
	const secondaryColor = $derived(props.secondaryColor === undefined ? ("var(--atmr-error-on-error)") : props.secondaryColor);
</script>

<Base {...props}>
	<path d="M15 8C15 11.866 11.866 15 8 15C4.13401 15 1 11.866 1 8C1 4.13401 4.13401 1 8 1C11.866 1 15 4.13401 15 8Z" {fill} />
	<path fill-rule="evenodd" clip-rule="evenodd" d="M8.00078 9.06164L5.70118 11.3612L4.6418 10.2993L6.9401 8.001L4.64268 5.70367L5.70204 4.64171L8.00077 6.94035L10.2987 4.64245L11.3581 5.7044L9.06145 8.00099L11.359 10.2985L10.2996 11.3604L8.00078 9.06164Z" fill={secondaryColor} />
</Base>
