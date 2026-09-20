<script lang="ts">
	import CounterWrapper from '$lib/components/Counter/CounterWrapper.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
</script>

<CounterWrapper size="s" content="10">
	<Typography as="div" variant="body-m" style={{ padding: '0 8px' }}>content</Typography>
</CounterWrapper>
