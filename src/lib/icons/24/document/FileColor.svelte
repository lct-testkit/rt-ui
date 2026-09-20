<script lang="ts">
	import Base from '../../Icon.svelte';
	let props: Record<string, any> = $props();
	const fill = $derived(props.fill === undefined ? ("var(--atmr-neutral-on-container)") : props.fill);
	const secondaryColor = $derived(props.secondaryColor === undefined ? ("var(--atmr-neutral-muted)") : props.secondaryColor);
</script>

<Base {...props}>
	<path fill-rule="evenodd" clip-rule="evenodd" d="M4 4C4 2.89543 4.89543 2 6 2L13.4737 2C13.9944 2 14.4946 2.20306 14.8679 2.56601L19.3942 6.96654C19.7815 7.3431 20 7.86033 20 8.40053L20 20C20 21.1046 19.1046 22 18 22L6 22C4.89543 22 4 21.1046 4 20L4 4Z" {fill} />
	<path fill-rule="evenodd" clip-rule="evenodd" d="M13 2.00002L13.4737 2C13.9944 2 14.4946 2.20305 14.8679 2.56601L19.3942 6.96654C19.7815 7.34311 20 7.86034 20 8.40053L20 9.00496L14.0001 9.00495C13.4479 9.00495 13.0002 8.55725 13.0002 8.00498L13 2.00002Z" fill={secondaryColor} />
</Base>
