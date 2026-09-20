<script lang="ts">
	import Base from '../../Icon.svelte';
	let props: Record<string, any> = $props();
	const fill = $derived(props.fill === undefined ? ("var(--atmr-error-default)") : props.fill);
	const secondaryColor = $derived(props.secondaryColor === undefined ? ("var(--atmr-error-on-error)") : props.secondaryColor);
</script>

<Base {...props}>
	<path fill-rule="evenodd" clip-rule="evenodd" d="M4 4C4 2.89543 4.89543 2 6 2L13.4737 2C13.9944 2 14.4946 2.20306 14.8679 2.56601L19.3942 6.96654C19.7815 7.3431 20 7.86033 20 8.40053L20 20C20 21.1046 19.1046 22 18 22L6 22C4.89543 22 4 21.1046 4 20L4 4Z" {fill} />
	<path fill-rule="evenodd" clip-rule="evenodd" d="M12.6146 12.8083C12.633 12.8908 12.6917 12.9585 12.7709 12.9882L16.0293 14.2101C16.1586 14.2586 16.2241 14.4027 16.1756 14.5319L15.8245 15.4683C15.776 15.5975 15.6319 15.663 15.5026 15.6146L12.29 14.4098C12.2047 14.3778 12.1087 14.3948 12.0395 14.4541L9.17796 16.9068C9.07313 16.9967 8.91531 16.9846 8.82545 16.8797L8.17466 16.1205C8.08481 16.0156 8.09695 15.8578 8.20178 15.768L11.0564 13.3211C11.1265 13.261 11.1578 13.1672 11.1378 13.0771L10.3221 9.40685C10.2922 9.27206 10.3772 9.13852 10.512 9.10857L11.4881 8.89163C11.6229 8.86168 11.7565 8.94667 11.7864 9.08145L12.6146 12.8083Z" fill={secondaryColor} />
</Base>
