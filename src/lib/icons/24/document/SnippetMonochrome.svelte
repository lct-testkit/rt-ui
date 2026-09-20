<script lang="ts">
	import Base from '../../Icon.svelte';
	let props: Record<string, any> = $props();
	const fill = $derived(props.fill === undefined ? ("var(--atmr-status-01-container-default)") : props.fill);
	const secondaryColor = $derived(props.secondaryColor === undefined ? ("var(--atmr-status-01-on-container)") : props.secondaryColor);
	const tertiaryColor = $derived(props.tertiaryColor === undefined ? ("var(--atmr-status-01-muted)") : props.tertiaryColor);
</script>

<Base {...props}>
	<path fill-rule="evenodd" clip-rule="evenodd" d="M4 4C4 2.89543 4.89543 2 6 2L13.4737 2C13.9944 2 14.4946 2.20306 14.8679 2.56601L19.3942 6.96654C19.7815 7.3431 20 7.86033 20 8.40053L20 20C20 21.1046 19.1046 22 18 22L6 22C4.89543 22 4 21.1046 4 20L4 4Z" {fill} />
	<path fill-rule="evenodd" clip-rule="evenodd" d="M8.93994 13.9993L6.96991 12.0305L8.03025 10.9695L10.5309 13.4686C10.6716 13.6093 10.7507 13.8 10.7507 13.999C10.7508 14.1979 10.6718 14.3887 10.5311 14.5294L8.03043 17.0303L6.96973 15.9697L8.93994 13.9993Z" fill={secondaryColor} />
	<path fill-rule="evenodd" clip-rule="evenodd" d="M12 15.4988L16 15.4988L16 16.9988L12 16.9988L12 15.4988Z" fill={tertiaryColor} />
</Base>
