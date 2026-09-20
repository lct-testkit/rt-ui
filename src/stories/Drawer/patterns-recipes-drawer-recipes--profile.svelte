<script lang="ts">
	// Port of stories/Drawer/Recipes: Profile (title "Patterns & Recipes/Drawer/Recipes"): employee profile in a right drawer
	import './_recipe-profile.css';
	import Box from '$lib/components/Box/Box.svelte';
	import Button from '$lib/components/Button/Button/Button.svelte';
	import CloseButton from '$lib/components/Button/CloseButton/CloseButton.svelte';
	import IconButton from '$lib/components/Button/IconButton/IconButton.svelte';
	import Drawer from '$lib/components/Drawer/Drawer.svelte';
	import TagGroup from '$lib/components/Tag/TagGroup/TagGroup.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import ArrowRight from '$lib/icons/24/navigation/ArrowRight.svelte';

	let isDrawerOpen = $state(false);

	const user = {
		avatar: '/story-assets/avatar.png',
		name: 'Константинопольский Константин Константинович',
		birthday: '12 декабря',
		city: 'Москва',
		email: 'aivanov@corp.com',
		skills: ['UI', 'UX', 'Figma', 'Research', 'Design Systems', 'AdobeXD', 'AfterEffects', 'Usability', 'Motion', '3D', 'Blender', 'Prototype']
	};

	const handleClose = () => {
		isDrawerOpen = false;
	};
	const handleOpen = () => {
		isDrawerOpen = true;
	};
</script>

<Button onclick={handleOpen} label="Открыть Drawer" />
<Drawer class="profile-drawer" isOpened={isDrawerOpen} onClickOverlay={handleClose}>
	<div class="atmr-drawer__header">
		<Typography variant="heading-h1" as="h1">Профиль сотрудника</Typography>
		<div class="atmr-drawer__actions">
			<CloseButton onclick={handleClose} aria-label="Close" />
		</div>
	</div>
	<div class="atmr-drawer__body">
		<Box class="profile">
			<Box class="profile__header" flex gapX="var(--atmr-spacing-3x)">
				<Box class="profile__avatar" flex flexShrink="0" flexGrow="0">
					<img src={user.avatar} alt="Avatar" />
				</Box>
				<Box class="profile__name" flex flexShrink="1" flexBasis="auto" flexGrow="1">
					<Typography variant="body-m" as="p" strong>{user.name}</Typography>
				</Box>
				<Box class="profile__arrow" flex flexBasis="6%" justifyContent="end">
					<IconButton variant="ghost" size="l" colorScheme="neutral">
						{#snippet icon()}<ArrowRight />{/snippet}
					</IconButton>
				</Box>
			</Box>
			<Box class="profile__info" flex flexDirection="column" gapY="var(--atmr-spacing-5x)">
				<Typography variant="body-m" as="p" strong>Сотрудник</Typography>
				<Box class="profile__info-item" flex flexDirection="column" gapY="var(--atmr-spacing-1x)">
					<Typography variant="body-s" as="p">День рождения</Typography>
					<Typography variant="body-m" as="p">{user.birthday}</Typography>
				</Box>
				<Box class="profile__info-item" flex flexDirection="column" gapY="var(--atmr-spacing-1x)">
					<Typography variant="body-s" as="p">Город</Typography>
					<Typography variant="body-m" as="p">{user.city}</Typography>
				</Box>
				<Box class="profile__info-item" flex flexDirection="column" gapY="var(--atmr-spacing-1x)">
					<Typography variant="body-s" as="p">Почта</Typography>
					<Typography variant="body-m" as="p">{user.email}</Typography>
				</Box>
				<Box class="profile__info-item" flex flexDirection="column" gapY="var(--atmr-spacing-1x)">
					<Typography variant="body-s" as="p">Навыки</Typography>
					<Box class="profile__skills">
						<TagGroup items={user.skills.map((skill) => ({ key: skill, value: skill }))} />
					</Box>
				</Box>
			</Box>
		</Box>
	</div>
</Drawer>
