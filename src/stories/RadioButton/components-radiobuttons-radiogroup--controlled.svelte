<script lang="ts">
	import Button from '$lib/components/Button/Button/Button.svelte';
	import RadioButton from '$lib/components/RadioButton/RadioButton/RadioButton.svelte';
	import RadioGroup from '$lib/components/RadioButton/RadioGroup/RadioGroup.svelte';

	const keys = ['key1', 'key2', 'key3']; // Массив ключей
	let value = $state(keys[0]); // начальное значение устанавливается как первый ключ

	const goToNextRadioButton = () => {
		// Получаем индекс текущей выбранной радиокнопки
		const currentIndex = keys.indexOf(value);
		// Вычисляем индекс следующей радиокнопки
		const nextIndex = (currentIndex + 1) % keys.length; // Остаток от деления для цикличности
		// Устанавливаем значение следующей кнопки
		value = keys[nextIndex];
	};
</script>

<Button onclick={goToNextRadioButton} label="Press me" style="margin-bottom: var(--atmr-spacing-4x)" />
<RadioGroup {value} onChange={(v) => (value = v)}>
	<RadioButton name="rb1" value="key1" label="В Личный кабинет" />
	<RadioButton name="rb2" value="key2" disabled label="На электронную почту" />
	<RadioButton name="rb3" value="key3" label="На почтовый адрес" />
</RadioGroup>
