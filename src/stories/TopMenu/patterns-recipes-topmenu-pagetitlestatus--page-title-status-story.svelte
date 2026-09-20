<script lang="ts">
	// Port of Patterns & Recipes/TopMenu/Page Title Status -> PageTitleStatusStory
	import '../_utils/topMenuCommon.css';
	import './_patterns-recipes-topmenu-pagetitlestatus--page-title-status-story.css';
	import Badge from '$lib/components/Badge/Badge.svelte';
	import Button from '$lib/components/Button/Button/Button.svelte';
	import FunctionButton from '$lib/components/Button/FunctionButton/FunctionButton.svelte';
	import TopMenu from '$lib/components/TopMenu/TopMenu.svelte';
	import TopMenuActionsContainer from '$lib/components/TopMenu/TopMenuActionsContainer.svelte';
	import TopMenuNavigationContainer from '$lib/components/TopMenu/TopMenuNavigationContainer.svelte';
	import TopMenuProductContainer from '$lib/components/TopMenu/TopMenuProductContainer.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import AddLarge from '$lib/icons/24/action/AddLarge.svelte';
	import Search from '$lib/icons/24/action/Search.svelte';
	import Ru from '$lib/icons/24/editor/Ru.svelte';
	import ArrowLeft from '$lib/icons/24/navigation/ArrowLeft.svelte';
	import MenuKebab from '$lib/icons/24/navigation/MenuKebab.svelte';
</script>

{#snippet kebab()}<MenuKebab size={24} />{/snippet}
{#snippet addLarge()}<AddLarge />{/snippet}

<!-- decorator: <div style={{ width: '100vw', height: '100%' }}><Story /></div> -->
<div style="width: 100vw; height: 100%">
	<div class="stories-main-top-menu">
		<div class="stories-main-top-menu__row stories-main-top-menu__primary">
			<TopMenu class="atmr-top-menu--page-title-status">
				<TopMenuNavigationContainer>
					<div class="atmr-top-menu__navigation-icon"><ArrowLeft /></div>
				</TopMenuNavigationContainer>

				<TopMenuProductContainer align="left">
					<div class="top-menu-page-title-status__content">
						<Typography variant="heading-h3">Page Title</Typography>
						<FunctionButton icon={kebab} variant="secondary" size="s" aria-label="Открыть меню" />

						<Badge label="Status text" size="s" variant="secondary" colorScheme="info" class="top-menu-page-title-status__badge" dot />
					</div>
				</TopMenuProductContainer>

				<TopMenuActionsContainer>
					<div class="atmr-top-menu__utilities-icon" aria-label="Поиск"><Search /></div>
					<div class="atmr-top-menu__utilities-icon" aria-label="language"><Ru /></div>
					<Button class="top-menu-page-title-status__action-button" size="m" variant="primary" colorScheme="accent" label="Button label" iconPrefix={addLarge} />
				</TopMenuActionsContainer>
			</TopMenu>
		</div>
	</div>
</div>
