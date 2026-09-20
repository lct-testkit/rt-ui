<script lang="ts">
	import Base from '../../Icon.svelte';
	let props: Record<string, any> = $props();
	const fill = $derived(props.fill === undefined ? ("var(--atmr-success-default)") : props.fill);
</script>

<Base {...props}>
	<path {fill} d="M20 16.499V12.7648C20 11.7516 19.4886 10.8069 18.6402 10.2529L13.6402 6.98808C12.6436 6.33731 11.3564 6.33731 10.3598 6.98808L5.3598 10.2529C4.51143 10.8069 4 11.7516 4 12.7648V16.499C4 17.3065 4.90764 17.781 5.57072 17.3202L10.8586 13.645C11.5448 13.168 12.4552 13.168 13.1414 13.645L18.4293 17.3202C19.0924 17.781 20 17.3065 20 16.499Z" />
</Base>
