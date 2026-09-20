<script lang="ts">
	import Base from '../../IconStatic16.svelte';
	let props: Record<string, any> = $props();
	const fill = $derived(props.fill === undefined ? ("var(--atmr-neutral-soft)") : props.fill);
</script>

<Base {...props}>
	<path {fill} d="M12.7935 6.26476L8.54521 10.7667C8.24921 11.0804 7.75027 11.0804 7.45426 10.7667L3.20601 6.26476C2.75459 5.78638 3.09374 5.00002 3.75149 5.00002H12.248C12.9057 5.00002 13.2449 5.78638 12.7935 6.26476Z" />
</Base>
