<script lang="ts">
	import Overlay from '$lib/components/Overlay/Overlay.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
</script>

<div style="position: relative; padding: 20px">
	<Typography variant="body-l">Overlay только для блока</Typography>
	<Overlay variant="primary" useInPortal={false} isOpened={false} style={{ position: 'absolute' }} />
</div>
