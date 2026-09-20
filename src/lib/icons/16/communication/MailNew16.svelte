<script lang="ts">
	import Base from '../../IconStatic16.svelte';
	let props: Record<string, any> = $props();
	const fill = $derived(props.fill);
	const secondaryColor = $derived(props.secondaryColor === undefined ? (props.secondaryColor || "#D91528") : props.secondaryColor);
</script>

<Base {...props}>
	<path {fill} fill-rule="evenodd" clip-rule="evenodd" d="M1 3.00085C1 2.44861 1.44775 2.00085 2 2.00085L14 2.00085C14.5522 2.00085 15 2.44861 15 3.00085L15 11.0009C15 12.6577 13.6567 14.0009 12 14.0009L4 14.0009C2.34326 14.0009 1 12.6577 1 11.0009L1 3.00085ZM13.5 11.0009L13.5001 3.50085L2.56445 3.50085L8.50008 8.50004L7.90648 9.13657C7.61985 9.39817 7.18138 9.39817 6.89476 9.13657L2.5 5.47314L2.5 11.0009C2.5 11.8292 3.17139 12.5009 4 12.5009L12 12.5009C12.8286 12.5009 13.5 11.8292 13.5 11.0009Z" />
	<path fill={secondaryColor} d="M16 8C16 9.65685 14.6569 11 13 11C11.3431 11 10 9.65685 10 8C10 6.34315 11.3431 5 13 5C14.6569 5 16 6.34315 16 8Z" />
</Base>
