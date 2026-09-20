<script lang="ts">
	import Base from '../../Icon.svelte';
	let props: Record<string, any> = $props();
	const fill = $derived(props.fill === undefined ? ("var(--atmr-status-06-container-default)") : props.fill);
	const secondaryColor = $derived(props.secondaryColor === undefined ? ("var(--atmr-status-06-on-container)") : props.secondaryColor);
</script>

<Base {...props}>
	<path fill-rule="evenodd" clip-rule="evenodd" d="M4 2C2.89543 2 2 2.89543 2 4L2 20C2 21.1046 2.89543 22 4 22L16 22C16.7571 22 17.4159 21.5793 17.7555 20.959C18.0207 20.4745 17.5523 20 17 20L5.25 20C4.55964 20 4 19.4404 4 18.75L4 15.25C4 14.5596 4.55964 14 5.25 14L17 14C17.5523 14 18 13.5523 18 13L18 7.3558C18 6.80924 17.7763 6.28648 17.381 5.90909L13.8653 2.55329C13.4933 2.19815 12.9987 2 12.4844 2L4 2Z" {fill} />
	<path fill-rule="evenodd" clip-rule="evenodd" d="M6.43957 18L5.43213 10L6.94396 10L7.57403 15.0033L8.01459 13.7514L8.27903 13L9.17303 13L9.43182 13.7581L9.84498 14.9684L10.4947 10L12.0075 10L10.9613 18L9.29486 18L8.71125 16.2903L8.10957 18L6.43957 18ZM16.6358 10L14.2263 10L12.4325 18L13.9698 18L14.4162 16.0088L16.4458 16.0088L16.8923 18L18.4295 18L16.6358 10ZM16.1095 14.5088L15.431 11.4827L14.7525 14.5088L16.1095 14.5088ZM22.3311 18L20.1006 18L18.432 10L19.9642 10L21.2159 16.001L22.4677 10L24 10L22.3311 18Z" fill={secondaryColor} />
</Base>
