<script lang="ts">
	// Port of stories/Drawer/Recipes: ChoosingCity (title "Patterns & Recipes/Drawer/Recipes"): city picker in a right drawer;
	// "Определить автоматически" asks the browser for the geolocation and reports failures with an error toast of the global
	// ToastNotificationsProvider (`useNotificationsStack().addNotification`).
	import './_recipe-choosing-city.css';
	import Box from '$lib/components/Box/Box.svelte';
	import Button from '$lib/components/Button/Button/Button.svelte';
	import CloseButton from '$lib/components/Button/CloseButton/CloseButton.svelte';
	import Drawer from '$lib/components/Drawer/Drawer.svelte';
	import { NOTIFICATION_COLORSCHEMES } from '$lib/components/Notifications/constants.js';
	import { useNotificationsStack } from '$lib/components/Notifications/hooks.svelte.js';
	import Select from '$lib/components/Select/Select.svelte';
	import { DEFAULT_AUTOCOMPLETE } from '$lib/components/Select/constants.js';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import Search from '$lib/icons/24/action/Search.svelte';

	interface City {
		id: number;
		name: string;
		region: string;
	}

	let isDrawerOpen = $state(false);
	const progress = 1;
	let isLoading = false; // React state that is never rendered
	let locationError: string | null = null; // React state that is never rendered
	let value = $state<string | number | null>(null);

	const { addNotification } = useNotificationsStack();

	const cities: City[] = [
		{ id: 1, name: 'Киров', region: 'Кировская область' },
		{ id: 2, name: 'Йошкар-Ола', region: 'Республика Марий Эл' },
		{ id: 3, name: 'Саранск', region: 'Республика Мордовия' },
		{ id: 4, name: 'Нижний Новгород', region: 'Нижегородская область' },
		{ id: 5, name: 'Оренбург', region: 'Оренбургская область' },
		{ id: 6, name: 'Самара', region: 'Самарская область' },
		{ id: 7, name: 'Саратов', region: 'Саратовская область' },
		{ id: 8, name: 'Ульяновск', region: 'Ульяновская область' },
		{ id: 9, name: 'Ижевск', region: 'Удмуртская Республика' },
		{ id: 10, name: 'Чебоксары', region: 'Чувашская Республика' }
	];

	const showErrorToast = (title: string) => {
		addNotification({ title, colorScheme: NOTIFICATION_COLORSCHEMES.error, closeButton: false, timeout: 3000, showIcon: true });
	};

	const searchCityByCoordinates = async (lat: number, lon: number) => {
		try {
			const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=ru`);
			const data = await response.json();
			if (data && data.address) {
				const city = data.address.city || data.address.town || data.address.village;
				const region = data.address.state || data.address.county;
				if (city) {
					cities.unshift({ id: data.place_id, name: city, region: region || 'Россия' });
					value = cities[0].id;
				}
			}
		} catch (error) {
			console.error('Error searching city:', error);
			locationError = 'Ошибка при поиске города';
		}
	};

	const getUserLocation = async () => {
		if (!navigator.geolocation) {
			locationError = 'Геолокация не поддерживается вашим браузером';
			return;
		}
		try {
			const permissionResult = await navigator.permissions.query({ name: 'geolocation' });
			if (permissionResult.state === 'denied') {
				showErrorToast('Для определения местоположения необходимо разрешить доступ к геолокации в настройках браузера');
				return;
			}
			isLoading = true;
			navigator.geolocation.getCurrentPosition(
				(position) => {
					const { latitude, longitude } = position.coords;
					searchCityByCoordinates(latitude, longitude);
					isLoading = false;
				},
				(error) => {
					switch (error.code) {
						case error.PERMISSION_DENIED:
							showErrorToast('Пользователь отклонил запрос на геолокацию');
							break;
						case error.POSITION_UNAVAILABLE:
							showErrorToast('Информация о местоположении недоступна');
							break;
						case error.TIMEOUT:
							showErrorToast('Превышено время ожидания запроса');
							break;
						default:
							showErrorToast('Произошла неизвестная ошибка');
					}
					isLoading = false;
				}
			);
		} catch (error) {
			console.error('Error requesting geolocation permission:', error);
			showErrorToast('Ошибка при запросе разрешения на использование геолокации');
		} finally {
			isLoading = false;
		}
	};

	const handleClose = () => {
		isDrawerOpen = false;
		locationError = null;
	};
	const handleOpen = () => {
		isDrawerOpen = true;
	};
	const handleCityClick = (city: City) => {
		value = city.id;
	};
</script>

<Button onclick={handleOpen} label="Открыть Drawer" />
<Drawer class="choosing-city-drawer" isOpened={isDrawerOpen} onClickOverlay={handleClose}>
	<div class="atmr-drawer__header">
		<Typography variant="heading-h1" as="h1">Выбор города</Typography>
		<div class="atmr-drawer__actions">
			<CloseButton onclick={handleClose} aria-label="Close" />
		</div>
	</div>
	<div class="atmr-drawer__body choosing-city">
		<Box class="progress">
			<!-- React renders `"Шаг ", progress, " из 6"` as three text nodes; every `{#if}` block below is one text node (expression tags keep the spaces) -->
			<Typography variant="body-m" class="progress__step">
				{#if true}{'Шаг '}{/if}{#if true}{progress}{/if}{#if true}{' из 6'}{/if}
			</Typography>
			<progress value={progress} max="6"></progress>
		</Box>
		<Select
			{value}
			onChange={(key) => (value = key)}
			autocomplete={{ ...DEFAULT_AUTOCOMPLETE, enabled: true }}
			size="l"
			label="Населенный пункт"
			items={cities.map((c) => ({ key: c.id, value: c.name }))}
			class="select-city"
			useInPortal={false}
		>
			{#snippet iconPrefix()}<Search />{/snippet}
		</Select>
		<Box class="cities-list">
			{#each cities.slice(0, 10) as city (city.id)}
				<Box class="cities-list__item" onclick={() => handleCityClick(city)}>
					<Typography variant="body-m">{city.name}</Typography>
					<Typography variant="description-m" class="cities-list__region">{city.region}</Typography>
				</Box>
			{/each}
		</Box>
	</div>
	<div class="atmr-drawer__footer">
		<Button size="l" onclick={getUserLocation} label="Определить автоматически" />
		<Button onclick={handleClose} variant="outline" colorScheme="neutral" size="l" label="Отмена" />
	</div>
</Drawer>
