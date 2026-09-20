<script lang="ts">
	// Port of stories/DropdownMenu FitContent (renderDropdownMenu, widthFitContent) with the height:300px decorator
	import './_styles.css';
	import './_placements.css';
	import RenderDropdownMenu from './_RenderDropdownMenu.svelte';
	import { OPTIONS } from './_options.js';
</script>

<div style="height: 300px;">
	<RenderDropdownMenu size="m" variant="primary" items={OPTIONS} useInPortal={false} widthFitContent class="none" />
</div>
