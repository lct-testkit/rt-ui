<script lang="ts">
	// Port of Patterns & Recipes/TopMenu/Double Logo Login -> DoubleLogoLoginStory
	import '../_utils/topMenuCommon.css';
	import './_patterns-recipes-topmenu-doublelogologin--double-logo-login-story.css';
	import Button from '$lib/components/Button/Button/Button.svelte';
	import TabsGroup from '$lib/components/Tabs/TabsGroup/TabsGroup.svelte';
	import TabsItem from '$lib/components/Tabs/TabsItem/TabsItem.svelte';
	import TopMenu from '$lib/components/TopMenu/TopMenu.svelte';
	import TopMenuActionsContainer from '$lib/components/TopMenu/TopMenuActionsContainer.svelte';
	import TopMenuBrandContainer from '$lib/components/TopMenu/TopMenuBrandContainer.svelte';
	import TopMenuProductContainer from '$lib/components/TopMenu/TopMenuProductContainer.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';

	const PRODUCT_TABS = [
		{ label: 'Label', index: '0' },
		{ label: 'Label', index: '1' },
		{ label: 'Label', index: '2' },
		{ label: 'Label', index: '3' },
		{ label: 'Label', index: '4' }
	];

	let tabValue = $state('0');
</script>

<!-- decorator: <div style={{ width: '100vw', height: '100%' }}><Story /></div> -->
<div style="width: 100vw; height: 100%">
	<div class="stories-main-top-menu">
		<div class="stories-main-top-menu__row stories-main-top-menu__primary">
			<TopMenu class="atmr-top-menu--double-logo-login">
				<TopMenuBrandContainer>
					<div class="atmr-top-menu__brand">
						<div class="atmr-top-menu__brand-icon-container">
							<img src="/story-assets/RostelecomB2C.svg" alt="Rostelecom B2C" width="28" height="28" />
						</div>
						<div class="atmr-top-menu__brand-icon-container atmr-top-menu__brand-icon-container--union">
							<img src="/story-assets/Atomaro_Logo.svg" alt="Atomaro logo" width="28" height="28" />
						</div>
						<Typography variant="body-l" strong>Header</Typography>
					</div>
				</TopMenuBrandContainer>

				<TopMenuProductContainer align="stretch">
					<TabsGroup variant="primary" size="s" value={tabValue} onChange={(index) => void (tabValue = index)} class="atmr-top-menu__product-tabs">
						{#each PRODUCT_TABS as tab (tab.index)}
							<TabsItem label={tab.label} index={tab.index} />
						{/each}
					</TabsGroup>
				</TopMenuProductContainer>

				<TopMenuActionsContainer>
					<Button size="m" variant="secondary" colorScheme="accent" label="Войти" />
				</TopMenuActionsContainer>
			</TopMenu>
		</div>
	</div>
</div>
