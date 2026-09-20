<script lang="ts">
	// Port of stories/Breadcrumbs UpToFiveCrumbs: two Breadcrumbs (3 and 5 crumbs) in `.breadcrumbs-content`
	import './_breadcrumbs-styles.css';
	import Breadcrumbs from '$lib/components/Breadcrumbs/Breadcrumbs.svelte';
</script>

{#snippet home()}<a href="#link1">Главная</a>{/snippet}
{#snippet cabinet()}<a href="#link2">Личный кабинет</a>{/snippet}
{#snippet profile()}<a href="#link3">Профиль</a>{/snippet}
{#snippet connections()}<a href="#link4">Мои подключения</a>{/snippet}
{#snippet requests()}<a href="#link5">Мои заявки</a>{/snippet}

<div class="breadcrumbs-content">
	<Breadcrumbs children={[home, cabinet, profile]} />
	<Breadcrumbs children={[home, cabinet, profile, connections, requests]} />
</div>
