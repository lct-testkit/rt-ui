<script lang="ts">
	// Port of stories/Pagination PaginationAdaptive: `useMediaQuery` (matchMedia + `change` listener) -> svelte/reactivity MediaQuery
	import './_styles.css';
	import { MediaQuery } from 'svelte/reactivity';
	import Pagination from '$lib/components/Pagination/Pagination.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';

	const sw = new MediaQuery('(max-width: 756px)');
	const mw = new MediaQuery('(max-width: 500px)');

	const siblingCount = $derived(sw.current && !mw.current ? 4 : 2);
</script>

<Typography variant="body-m" style={{ marginBottom: '20px' }}>
	{'Для мобильной версии Pagination используйте type={buttonsMobile}. В showCode представлен пример функции с медиа-запросом, измените ширину окна (можно расширить ширину бокового меню), чтобы проверить работоспособность'}
</Typography>
<Typography variant="body-m" style={{ marginBottom: '20px', width: '100%' }}>
	Рекомендуем не использовать размер s на мобильных разрешениях
</Typography>
<Pagination
	count={15}
	size="m"
	variant="primary"
	alignment="left"
	pageSize={1}
	type={sw.current ? 'buttonsMobile' : 'buttons'}
	{siblingCount}
	total={{ enabled: !sw.current }}
	jumper={{ enabled: !sw.current }}
/>
