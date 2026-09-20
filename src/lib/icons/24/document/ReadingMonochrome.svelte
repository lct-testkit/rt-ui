<script lang="ts">
	import Base from '../../Icon.svelte';
	let props: Record<string, any> = $props();
	const fill = $derived(props.fill === undefined ? ("var(--atmr-error-container-default)") : props.fill);
	const secondaryColor = $derived(props.secondaryColor === undefined ? ("var(--atmr-error-on-container)") : props.secondaryColor);
</script>

<Base {...props}>
	<path fill-rule="evenodd" clip-rule="evenodd" d="M4 4C4 2.89543 4.89543 2 6 2L13.4737 2C13.9944 2 14.4946 2.20306 14.8679 2.56601L19.3942 6.96654C19.7815 7.3431 20 7.86033 20 8.40053L20 20C20 21.1046 19.1046 22 18 22L6 22C4.89543 22 4 21.1046 4 20L4 4Z" {fill} />
	<path fill-rule="evenodd" clip-rule="evenodd" d="M11.0563 13.321C11.1264 13.2609 11.1577 13.1671 11.1377 13.077L10.3221 9.40671C10.2921 9.27193 10.3771 9.13839 10.5119 9.10844L11.4881 8.89151C11.6228 8.86155 11.7564 8.94654 11.7863 9.08132L12.6145 12.8082C12.6329 12.8907 12.6917 12.9584 12.7708 12.988L16.0292 14.2099C16.1585 14.2584 16.224 14.4025 16.1755 14.5318L15.8244 15.4681C15.7759 15.5974 15.6318 15.6629 15.5025 15.6144L12.2899 14.4097C12.2046 14.3777 12.1086 14.3947 12.0394 14.454L9.17787 16.9067C9.07304 16.9966 8.91522 16.9844 8.82536 16.8796L8.17457 16.1203C8.08471 16.0155 8.09686 15.8577 8.20169 15.7678L11.0563 13.321Z" fill={secondaryColor} />
</Base>
