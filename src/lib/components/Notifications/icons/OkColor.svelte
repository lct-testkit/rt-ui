<script lang="ts">
	// packages/icons/dist/24/alert/OkColor.js (see InformationColor.svelte: the generated icon lacks the path fills)
	import Base from '../../../icons/Icon.svelte';
	let props: Record<string, any> = $props();
	const fill = $derived(props.fill ?? 'var(--atmr-success-soft)');
	const secondaryColor = $derived(props.secondaryColor ?? 'var(--atmr-success-on-success)');
</script>

<Base {...props}>
	<path d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" {fill} />
	<path fill-rule="evenodd" clip-rule="evenodd" d="M17.561 9.1768L11.061 15.5704C10.7479 15.8784 10.2449 15.8763 9.93433 15.5657L6.93433 12.5657L8.0657 11.4343L10.5047 13.8733L16.439 8.03613L17.561 9.1768Z" fill={secondaryColor} />
</Base>
