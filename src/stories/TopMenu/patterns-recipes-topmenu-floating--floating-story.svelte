<script lang="ts">
	// Port of Patterns & Recipes/TopMenu/Floating -> FloatingStory
	import '../_utils/topMenuCommon.css';
	import './_patterns-recipes-topmenu-floating--floating-story.css';
	import type { Component } from 'svelte';
	import Button from '$lib/components/Button/Button/Button.svelte';
	import TopMenu from '$lib/components/TopMenu/TopMenu.svelte';
	import TopMenuActionsContainer from '$lib/components/TopMenu/TopMenuActionsContainer.svelte';
	import TopMenuBrandContainer from '$lib/components/TopMenu/TopMenuBrandContainer.svelte';
	import TopMenuFlow from '$lib/components/TopMenu/TopMenuFlow.svelte';
	import TopMenuNavigationContainer from '$lib/components/TopMenu/TopMenuNavigationContainer.svelte';
	import TopMenuProductContainer from '$lib/components/TopMenu/TopMenuProductContainer.svelte';
	import TopMenuProfileContainer from '$lib/components/TopMenu/TopMenuProfileContainer.svelte';
	import TopMenuUtilitiesContainer from '$lib/components/TopMenu/TopMenuUtilitiesContainer.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import Arrow from '$lib/icons/24/action/Arrow.svelte';
	import Settings from '$lib/icons/24/action/Settings.svelte';
	import HelpStroke from '$lib/icons/24/alert/HelpStroke.svelte';
	import Crop from '$lib/icons/24/editor/Crop.svelte';
	import Marker from '$lib/icons/24/editor/Marker.svelte';
	import PaintBucket from '$lib/icons/24/editor/PaintBucket.svelte';
	import PenTool from '$lib/icons/24/editor/PenTool.svelte';
	import Scissors from '$lib/icons/24/editor/Scissors.svelte';
	import ArrowLeft from '$lib/icons/24/navigation/ArrowLeft.svelte';
	import ChevronDown from '$lib/icons/24/navigation/ChevronDown.svelte';

	const ICONS: { key: string; icon: Component<any> }[] = [
		{ key: 'arrow', icon: Arrow },
		{ key: 'marker', icon: Marker },
		{ key: 'scissors', icon: Scissors },
		{ key: 'penTool', icon: PenTool },
		{ key: 'paintBucket', icon: PaintBucket },
		{ key: 'crop', icon: Crop }
	];
</script>

{#snippet chevronDown()}<ChevronDown />{/snippet}
{#snippet avatar()}
	<img src="/story-assets/profileAvatarExample.jpg" alt="woman" width="36" height="36" class="atmr-top-menu__profile-avatar atmr-top-menu__profile-avatar--soft" />
{/snippet}

<!-- decorator: <div style={{ width: '100vw', height: '100%' }}><Story /></div> -->
<div style="width: 100vw; height: 100%">
	<div class="stories-main-top-menu stories-main-top-menu--floating">
		<TopMenu variant="floating" class="atmr-top-menu--floating">
			<TopMenuFlow left>
				<TopMenuNavigationContainer>
					<div class="atmr-top-menu__navigation-icon"><ArrowLeft /></div>
				</TopMenuNavigationContainer>

				<TopMenuBrandContainer>
					<div class="atmr-top-menu__brand">
						<div class="atmr-top-menu__brand-icon-container">
							<img src="/story-assets/RostelecomB2C.svg" alt="Rostelecom B2C" width="28" height="28" />
						</div>
						<Typography variant="body-l" strong>Header</Typography>
					</div>
				</TopMenuBrandContainer>
			</TopMenuFlow>

			<TopMenuFlow center>
				<TopMenuProductContainer align="center">
					{#each ICONS as item (item.key)}
						<button type="button" class="atmr-top-menu__product-item">
							<span class="atmr-top-menu__product-item-icon"><item.icon /></span>
						</button>
					{/each}
				</TopMenuProductContainer>
			</TopMenuFlow>

			<TopMenuFlow right>
				<TopMenuActionsContainer>
					<Button size="m" variant="secondary" label="Создать" iconSuffix={chevronDown} />
				</TopMenuActionsContainer>

				<TopMenuUtilitiesContainer>
					<button type="button" class="atmr-top-menu__product-item"><HelpStroke /></button>
					<button type="button" class="atmr-top-menu__product-item"><Settings /></button>
				</TopMenuUtilitiesContainer>

				<TopMenuProfileContainer prefix={avatar} />
			</TopMenuFlow>
		</TopMenu>
	</div>
</div>
