<script lang="ts">
	// packages/icons/dist/24/alert/AttentionColor.js (see InformationColor.svelte: the generated icon lacks the path fills)
	import Base from '../../../icons/Icon.svelte';
	let props: Record<string, any> = $props();
	const fill = $derived(props.fill ?? 'var(--atmr-warning-soft)');
	const secondaryColor = $derived(props.secondaryColor ?? 'var(--atmr-warning-on-warning)');
</script>

<Base {...props}>
	<path d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" {fill} />
	<path d="M11.2977 13.5625H12.6977L12.9217 10.602V7.19995H11.0737V10.602L11.2977 13.5625ZM11.0737 17H12.9217V15.068H11.0737V17Z" fill={secondaryColor} />
</Base>
