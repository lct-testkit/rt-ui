<script lang="ts">
	// Port of stories/Drawer: DrawerCustom (title "Patterns & Recipes/Drawer"), args { dimension: 420, position: 'right', overlay: true,
	// overlayVariant: 'primary', useInPortal: true, className: 'drawer-example' } (+ storybook actions for onClose / onClickOverlay / onEsc)
	import './_drawer-styles.css';
	import Button from '$lib/components/Button/Button/Button.svelte';
	import CloseButton from '$lib/components/Button/CloseButton/CloseButton.svelte';
	import Drawer from '$lib/components/Drawer/Drawer.svelte';
	import Input from '$lib/components/Input/Input.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';

	let open = $state(false);

	const showDrawer = () => {
		open = true;
	};
	const handleClose = () => {
		open = false;
	};
	const handleEscape = () => {
		handleClose();
	};
</script>

{#snippet renderHeader()}
	<div class="atmr-drawer__header">
		<Typography variant="heading-h1" as="h1">Заголовок</Typography>
		<div class="atmr-drawer__actions">
			<CloseButton onclick={handleClose} aria-label="Close" />
		</div>
	</div>
{/snippet}

{#snippet renderFooter()}
	<div class="atmr-drawer__footer">
		<Button label="Действие" size="l" />
		<Button variant="outline" label="Отмена" size="l" />
	</div>
{/snippet}

<Button onclick={showDrawer} label="Открыть Drawer" data-testid="click" />
<Drawer
	dimension={420}
	position="right"
	overlay
	overlayVariant="primary"
	useInPortal
	class="drawer-example"
	isOpened={open}
	onClickOverlay={() => {}}
	onClose={handleClose}
	onEsc={handleEscape}
>
	{@render renderHeader()}
	<div class="atmr-drawer__body">
		<Typography variant="body-m">
			Компонент Drawer реализован как пустой контейнер, который вы можете стилизовать так, как вам нужно и наполнить его любым контентом.
		</Typography>
		<Input size="m" />
	</div>
	{@render renderFooter()}
</Drawer>
