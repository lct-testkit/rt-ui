<script lang="ts">
	import Base from '../../IconStatic16.svelte';
	let props: Record<string, any> = $props();
	const fill = $derived(props.fill === undefined ? ("var(--atmr-warning-soft)") : props.fill);
	const secondaryColor = $derived(props.secondaryColor === undefined ? ("var(--atmr-warning-on-warning)") : props.secondaryColor);
</script>

<Base {...props}>
	<path d="M15.0003 8.00065C15.0003 11.867 11.866 15.0013 7.99967 15.0013C4.13332 15.0013 0.999023 11.867 0.999023 8.00065C0.999023 4.1343 4.13332 1 7.99967 1C11.866 1 15.0003 4.1343 15.0003 8.00065Z" {fill} />
	{","}
	<path d="M7.39365 9.20667H8.60577L8.79971 6.77714V4H7.19971V6.77714L7.39365 9.20667Z" fill={secondaryColor} />
	{","}
	<path d="M7.19971 12H8.79971V10.4H7.19971V12Z" fill={secondaryColor} />
</Base>
