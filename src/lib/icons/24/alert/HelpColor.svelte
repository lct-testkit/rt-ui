<script lang="ts">
	import Base from '../../Icon.svelte';
	let props: Record<string, any> = $props();
	const fill = $derived(props.fill === undefined ? ("var(--atmr-accent-soft)") : props.fill);
	const secondaryColor = $derived(props.secondaryColor === undefined ? ("var(--atmr-accent-on-accent)") : props.secondaryColor);
</script>

<Base {...props}>
	<path d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" {fill} />
	<path d="M10.9862 14.088H12.7502C12.7502 13.472 12.9042 13.108 13.4082 12.674C14.8082 11.47 15.2142 10.784 15.2142 9.66403C15.2142 8.08203 14.0102 7.00403 11.9802 7.00403C9.97818 7.00403 8.73218 8.43203 8.73218 9.83203C8.73218 10.252 8.80218 10.574 8.92818 10.84L10.5382 10.504C10.4822 10.364 10.4402 10.168 10.4402 9.98603C10.4402 9.11803 11.1682 8.60003 12.0222 8.60003C12.8762 8.60003 13.4782 9.06203 13.4782 9.79003C13.4782 10.504 13.1142 10.994 12.1902 11.736C11.2662 12.478 10.9862 13.01 10.9862 13.864V14.088ZM10.9442 17H12.7922V15.068H10.9442V17Z" fill={secondaryColor} />
</Base>
