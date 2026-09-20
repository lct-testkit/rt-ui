<script lang="ts">
	// Port of stories/Popover/ContactCard
	import './_decorator.css';
	import './_common.css';
	import './_contact-card.css';
	import Popover from '$lib/components/Popover/Popover.svelte';
	import CloseButton from '$lib/components/Button/CloseButton/CloseButton.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import Moon from '$lib/icons/24/place/Moon.svelte';
	import Call from '$lib/icons/24/communication/Call.svelte';
	import Mail from '$lib/icons/24/communication/Mail.svelte';

	let isOpened = $state(false);
</script>

<Popover
	{isOpened}
	onOpen={() => {
		isOpened = true;
	}}
	onClose={() => {
		isOpened = false;
	}}
	popoverClassName="stories-contact-card-popover"
>
	{#snippet innerChildren()}
		<div class="stories-contact-card">
			<div class="stories-contact-card__header">
				<div class="stories-contact-card__title">
					<img class="stories-contact-card__avatar" src="/story-assets/profileAvatarExample.jpg" alt="Алиса Попова" />
					<div class="stories-contact-card__title-text">
						<Typography class="stories-contact-card__title-name" variant="body-s">Алиса Попова</Typography>
						<Typography class="stories-contact-card__title-subtitle" variant="description-l">Дизайнер</Typography>
					</div>
				</div>
				<CloseButton size="s" class="stories-contact-card__close" onclick={() => (isOpened = false)} />
			</div>
			<div class="stories-contact-card__body">
				<div class="stories-contact-card__row stories-contact-card__row--team">
					<span class="stories-contact-card__icon"><Moon size={16} /></span>
					<Typography variant="body-s" class="stories-contact-card__text">Команда KOD</Typography>
				</div>
				<div class="stories-contact-card__row stories-contact-card__row--contact">
					<span class="stories-contact-card__icon"><Call size={16} /></span>
					<Typography variant="body-s" class="stories-contact-card__link" as="a" href="tel:+79996730820">+7 999 673 08 20</Typography>
				</div>
				<div class="stories-contact-card__row stories-contact-card__row--contact">
					<span class="stories-contact-card__icon"><Mail size={16} /></span>
					<Typography variant="body-s" class="stories-contact-card__link" as="a" href="mailto:alisapopova@corp.com">alisapopova@corp.com</Typography>
				</div>
			</div>
		</div>
	{/snippet}
	<Typography variant="body-l" as="span" class="trigger" style={{ width: 'fit-content' }}>Поповер с контактами</Typography>
</Popover>
