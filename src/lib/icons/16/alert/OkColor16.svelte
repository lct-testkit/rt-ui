<script lang="ts">
	import Base from '../../IconStatic16.svelte';
	let props: Record<string, any> = $props();
	const fill = $derived(props.fill === undefined ? ("var(--atmr-success-soft)") : props.fill);
	const secondaryColor = $derived(props.secondaryColor === undefined ? ("var(--atmr-success-on-success)") : props.secondaryColor);
</script>

<Base {...props}>
	<path d="M15 8C15 11.866 11.866 15 8 15C4.13401 15 1 11.866 1 8C1 4.13401 4.13401 1 8 1C11.866 1 15 4.13401 15 8Z" {fill} />
	<path fill-rule="evenodd" clip-rule="evenodd" d="M12.0304 6.02941L7.53039 10.5294C7.23749 10.8223 6.76262 10.8223 6.46973 10.5294L3.96973 8.02941L5.03039 6.96875L7.00006 8.93842L10.9697 4.96875L12.0304 6.02941Z" fill={secondaryColor} />
</Base>
