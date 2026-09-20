<script lang="ts">
	// Port of stories/Popover/Feedback (FeedbackComponent + args) with decorator `withPopoverRootOffset`, styles-common.css and styles.css
	import './_decorator.css';
	import './_common.css';
	import './_feedback.css';
	import Popover from '$lib/components/Popover/Popover.svelte';
	import Button from '$lib/components/Button/Button/Button.svelte';
	import RadioGroup from '$lib/components/RadioButton/RadioGroup/RadioGroup.svelte';
	import RadioButton from '$lib/components/RadioButton/RadioButton/RadioButton.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';

	let value = $state('clear');
</script>

<Popover
	title="Привет! Я поповер"
	subtitle="Всплывающий элемент интерфейса с различным наполнением"
	showCloseButton={true}
	popoverClassName="stories-feedback-popover"
>
	{#snippet body()}
		<RadioGroup {value} onChange={(nextValue) => (value = nextValue)}>
			<RadioButton name="feedback" value="clear" label="Понятно" />
			<RadioButton name="feedback" value="unclear" label="Непонятно" />
		</RadioGroup>
	{/snippet}
	{#snippet footer()}
		<Button label="Дальше" />
		<Button label="Отмена" variant="secondary" />
	{/snippet}
	<Typography variant="body-l" as="span" class="trigger" style={{ width: 'fit-content' }}>Поповер с выбором</Typography>
</Popover>
