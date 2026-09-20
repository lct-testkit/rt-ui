<script lang="ts">
	import Box from '$lib/components/Box/Box.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
</script>

<Box
	borderRadius="atmr-border-radius-2xl"
	boxShadow="atmr-shadow-bottom-m"
	pt="atmr-spacing-3x"
	pb="atmr-spacing-3x"
	pl="atmr-spacing-3x"
	pr="atmr-spacing-3x"
	tag="div"
	style={{ width: '300px', height: '300px' }}
>
	<Typography variant="body-m" style={{ display: 'block' }}>Box content</Typography>
</Box>
