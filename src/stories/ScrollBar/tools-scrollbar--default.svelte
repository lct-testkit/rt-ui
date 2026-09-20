<script lang="ts">
	// Port of ScrollBar.stories.js "default": plain markup with the `atmr-scroll-bar` CSS class (no component).
	const rows = Array.from(Array(20).keys());
</script>

<div class="atmr-scroll-bar" style="height: 400px; width: 700px">
	{#each rows as _}
		<div style="padding: 5px 0px; width: 1000px; font: var(--atmr-font-body-m); color: var(--atmr-fg-default)">
			Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
		</div>
	{/each}
</div>
