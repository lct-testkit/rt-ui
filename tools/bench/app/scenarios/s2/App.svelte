<script lang="ts">
	import Input from '@rt-ui/components/Input/Input.svelte';
	import Select from '@rt-ui/components/Select/Select.svelte';
	import Checkbox from '@rt-ui/components/Checkbox/Checkbox/Checkbox.svelte';
	import Switch from '@rt-ui/components/Switch/Switch.svelte';
	import Button from '@rt-ui/components/Button/Button/Button.svelte';
	import Modal from '@rt-ui/components/Modal/Modal.svelte';

	const regions = [
		{ key: 'msk', value: 'Москва' },
		{ key: 'spb', value: 'Санкт-Петербург' },
		{ key: 'nsk', value: 'Новосибирск' },
		{ key: 'ekb', value: 'Екатеринбург' },
		{ key: 'kzn', value: 'Казань' }
	];
	let opened = $state(false);
</script>

<form style="display:flex;flex-direction:column;gap:16px;padding:24px;max-width:480px" onsubmit={(e) => e.preventDefault()}>
	<Input label="Название организации" placeholder="ООО «Ромашка»" />
	<Input label="ИНН" placeholder="10 цифр" />
	<Input label="Контактное лицо" placeholder="Фамилия Имя Отчество" clearable />
	<Select label="Регион" items={regions} />
	<Checkbox label="Согласен на обработку персональных данных" />
	<Switch label="Присылать уведомления" />
	<div style="display:flex;gap:12px">
		<Button id="save" label="Сохранить" />
		<Button id="open-modal" variant="secondary" label="Отмена" onclick={() => (opened = true)} />
	</div>
</form>

<Modal isOpened={opened} maxWidth="420px" isCentered onEsc={() => (opened = false)} onClickOverlay={() => (opened = false)}>
	<div style="padding:24px;display:flex;flex-direction:column;gap:16px">
		<p>Закрыть форму без сохранения?</p>
		<Button id="close-modal" label="Да, закрыть" onclick={() => (opened = false)} />
	</div>
</Modal>
