<script lang="ts">
	import Base from '../../Icon.svelte';
	let props: Record<string, any> = $props();
	const fill = $derived(props.fill === undefined ? ("var(--atmr-neutral-soft)") : props.fill);
</script>

<Base {...props}>
	<path {fill} d="M13.1588 12.916L18.4017 9.18899C19.0717 8.71269 20 9.19173 20 10.0138C20 10.0552 19.9798 10.0939 19.9458 10.1176L13.715 14.459C12.6844 15.1771 11.3156 15.1771 10.285 14.459L4.05418 10.1176C4.02023 10.0939 4 10.0552 4 10.0138C4 9.19173 4.92828 8.71269 5.5983 9.18899L10.8412 12.916C11.535 13.4092 12.465 13.4092 13.1588 12.916Z" />
</Base>
