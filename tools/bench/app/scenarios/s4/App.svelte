<script lang="ts">
	// S4: the ceiling. `import *` of the whole library barrel; the namespace object escapes to a global, so nothing can be tree-shaken.
	import * as lib from '@rt-ui/index.ts';
	(globalThis as any).__lib = lib;
</script>

<lib.Button label="Сохранить" />
