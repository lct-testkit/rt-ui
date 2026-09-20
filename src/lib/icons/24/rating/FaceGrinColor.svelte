<script lang="ts">
	import Base from '../../Icon.svelte';
	let props: Record<string, any> = $props();
	const fill = $derived(props.fill === undefined ? ("var(--atmr-static-black)") : props.fill);
	const secondaryColor = $derived(props.secondaryColor === undefined ? ("var(--atmr-warning-default)") : props.secondaryColor);
	const tertiaryColor = $derived(props.tertiaryColor === undefined ? ("var(--atmr-static-white)") : props.tertiaryColor);
</script>

<Base {...props}>
	<path d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" fill={secondaryColor} />
	<path d="M7 13H17C17 15.7614 14.7614 18 12 18C9.23858 18 7 15.7614 7 13Z" fill={tertiaryColor} />
	<path fill-rule="evenodd" clip-rule="evenodd" d="M10.2446 10.4531L7.23294 11.4531L6.76025 10.0295L9.77196 9.02954L10.2446 10.4531ZM17 13.0001H7.00001C7.00001 13.5227 7.08019 14.0266 7.22891 14.5001C7.86605 16.5287 9.76119 18.0001 12 18.0001C14.2388 18.0001 16.134 16.5287 16.7711 14.5001C16.9198 14.0266 17 13.5227 17 13.0001ZM8.83683 14.5001C9.39856 15.6826 10.6038 16.5001 12 16.5001C13.3962 16.5001 14.6015 15.6826 15.1632 14.5001H8.83683ZM13.7603 10.4531L16.772 11.4531L17.2446 10.0295L14.2329 9.02954L13.7603 10.4531Z" {fill} />
</Base>
