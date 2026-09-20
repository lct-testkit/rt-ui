<script lang="ts">
	import Box from '$lib/components/Box/Box.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
</script>

<Box
	gapY="10px"
	flex
	flexDirection="column"
	bg="atmr-bg-elevated-m"
	py="atmr-spacing-3x"
	px="atmr-spacing-3x"
	boxShadow="atmr-shadow-bottom-m"
	borderRadius="atmr-border-radius-xs"
	style={{ width: '100%', maxWidth: '600px', height: '600px' }}
>
	<Box flex justifyContent="center" alignItems="center" flexBasis="50px" class="page-item">
		<Typography variant="body-m">Header</Typography>
	</Box>
	<Box flex gapX="10px" style={{ height: '100%' }}>
		<Box flex justifyContent="center" alignItems="center" flexBasis="30%" class="page-item">
			<Typography variant="body-m">Sidebar</Typography>
		</Box>
		<Box flex justifyContent="center" alignItems="center" flexBasis="70%" class="page-item">
			<Typography variant="body-m">Content</Typography>
		</Box>
	</Box>
</Box>

<style>
	:global(.page-item) {
		padding: var(--atmr-spacing-3x);
		border: 1px solid var(--atmr-border-default);
		border-radius: var(--atmr-border-radius-xs);
	}
</style>
