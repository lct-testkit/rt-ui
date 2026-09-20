<script lang="ts">
	import Base from '../../Icon.svelte';
	let props: Record<string, any> = $props();
	const fill = $derived(props.fill === undefined ? ("var(--atmr-neutral-container-hover)") : props.fill);
	const secondaryColor = $derived(props.secondaryColor === undefined ? ("var(--atmr-neutral-muted)") : props.secondaryColor);
</script>

<Base {...props}>
	<path fill-rule="evenodd" clip-rule="evenodd" d="M4 4C4 2.89543 4.89543 2 6 2L13.4737 2C13.9944 2 14.4946 2.20306 14.8679 2.56601L19.3942 6.96654C19.7815 7.3431 20 7.86033 20 8.40053L20 20C20 21.1046 19.1046 22 18 22L6 22C4.89543 22 4 21.1046 4 20L4 4Z" {fill} />
	<path fill-rule="evenodd" clip-rule="evenodd" d="M13 1.98275L13.4737 1.98273C13.9944 1.98273 14.4946 2.18578 14.8679 2.54874L19.3942 6.94926C19.7815 7.32584 20 7.84306 20 8.38326L20 8.98769L14.0001 8.98768C13.4479 8.98768 13.0002 8.53998 13.0002 7.9877L13 1.98275Z" fill={secondaryColor} />
</Base>
