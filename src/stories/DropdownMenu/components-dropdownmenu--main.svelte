<script lang="ts">
	// Port of stories/DropdownMenu Main (renderDropdownMenu) with the 300x300 flex decorator
	import './_styles.css';
	import './_placements.css';
	import RenderDropdownMenu from './_RenderDropdownMenu.svelte';
	import { OPTIONS } from './_options.js';
</script>

<div style="width: 300px; height: 300px; display: flex; align-items: flex-start; justify-content: center;">
	<RenderDropdownMenu size="m" variant="primary" items={OPTIONS} useInPortal={false} class="--stories-main" />
</div>
