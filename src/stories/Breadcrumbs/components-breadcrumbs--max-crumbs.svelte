<script lang="ts">
	// Port of stories/Breadcrumbs maxCrumbs: args { maxCrumbs: 6, size: 's', variant: 'primary' }, six crumbs
	import Breadcrumbs from '$lib/components/Breadcrumbs/Breadcrumbs.svelte';
</script>

{#snippet home()}<a href="#link1">Главная</a>{/snippet}
{#snippet cabinet()}<a href="#link2">Личный кабинет</a>{/snippet}
{#snippet profile()}<a href="#link3">Профиль</a>{/snippet}
{#snippet connections()}<a href="#link4">Мои подключения</a>{/snippet}
{#snippet requests()}<a href="#link5">Мои заявки</a>{/snippet}
{#snippet processing()}<a href="#link6">Обработка заявки</a>{/snippet}

<Breadcrumbs size="s" variant="primary" maxCrumbs={6} children={[home, cabinet, profile, connections, requests, processing]} />
