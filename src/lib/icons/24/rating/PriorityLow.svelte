<script lang="ts">
	import Base from '../../Icon.svelte';
	let props: Record<string, any> = $props();
	const fill = $derived(props.fill === undefined ? ("var(--atmr-neutral-muted)") : props.fill);
</script>

<Base {...props}>
	<path {fill} d="M13.1598 11.0844L18.4002 14.8147C19.0705 15.2919 20 14.8126 20 13.9897C20 13.9484 19.9798 13.9096 19.9459 13.8859L13.7166 9.53967C12.6853 8.82011 11.3147 8.82011 10.2834 9.53967L4.05415 13.8859C4.02022 13.9096 4 13.9484 4 13.9897C4 14.8126 4.92947 15.2919 5.59984 14.8147L10.8402 11.0844C11.5344 10.5902 12.4656 10.5902 13.1598 11.0844Z" />
</Base>
