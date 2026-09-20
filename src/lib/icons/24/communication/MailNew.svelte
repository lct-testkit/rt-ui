<script lang="ts">
	import Base from '../../Icon.svelte';
	let props: Record<string, any> = $props();
	const fill = $derived(props.fill);
	const secondaryColor = $derived(props.secondaryColor === undefined ? (props.secondaryColor || "#D91528") : props.secondaryColor);
</script>

<Base {...props}>
	<path {fill} fill-rule="evenodd" clip-rule="evenodd" d="M3.5 7.47226V17C3.5 17.8284 4.17157 18.5 5 18.5H19C19.8284 18.5 20.5 17.8284 20.5 17V5.5H3.5647L12.0072 13.2096L14.0022 11.439L14.9978 12.5609L12.4978 14.7797C12.2108 15.0345 11.7777 15.0314 11.4943 14.7726L3.5 7.47226ZM2 5C2 4.44772 2.44772 4 3 4H21C21.5523 4 22 4.44772 22 5V17C22 18.6569 20.6569 20 19 20H5C3.34315 20 2 18.6569 2 17V5Z" />
	<path d="M24 12C24 14.2091 22.2091 16 20 16C17.7909 16 16 14.2091 16 12C16 9.79086 17.7909 8 20 8C22.2091 8 24 9.79086 24 12Z" fill={secondaryColor} />
</Base>
