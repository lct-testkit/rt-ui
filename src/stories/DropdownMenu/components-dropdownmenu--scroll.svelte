<script lang="ts">
	// Port of stories/DropdownMenu Scroll (renderDropdownMenu) with the 300x300 flex decorator
	import './_styles.css';
	import './_placements.css';
	import RenderDropdownMenu from './_RenderDropdownMenu.svelte';
	import { OPTIONS_LONG } from './_options.js';
</script>

<div style="display: flex; align-items: flex-start; justify-content: center; width: 300px; height: 300px;">
	<RenderDropdownMenu size="m" variant="primary" items={OPTIONS_LONG} useInPortal={false} class="--stories-scroll" />
</div>
