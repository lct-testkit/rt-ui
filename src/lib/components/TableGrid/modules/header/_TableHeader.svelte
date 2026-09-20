<script lang="ts">
	// Port of TableGrid/modules/header/components/Header.tsx: the header row (`row-index` 2): an underlay that keeps the sticky header
	// opaque + the columns container whose cells are the header cells.
	import { HEADER_ROW_POSITION } from '../../constants.js';
	import LayoutColumns from '../layout/_LayoutColumns.svelte';
	import LayoutRow from '../layout/_LayoutRow.svelte';
</script>

<LayoutRow position={HEADER_ROW_POSITION}>
	<div class="atmr-tablegrid__header-underlay"></div>
	<LayoutColumns header>
		<div class="atmr-tablegrid__header"></div>
	</LayoutColumns>
</LayoutRow>
