<script lang="ts">
	// In React the story calls `usePopper({ ...args, popper: popoverRef?.current, trigger: popoverTriggerRef?.current })` while
	// rendering, when both refs are still `undefined` — the hook never gets elements, so NO popper is positioned and the
	// "popper" div stays a plain flex box. The Svelte story therefore must not call usePopper (CONVENTIONS section 9.2).
	import Input from '$lib/components/Input/Input.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import './styles.css';
</script>

<!-- meta decorator: container > scroll-container > story, followed by a caption -->
<div class="container">
	<div class="scroll-container">
		<div class="content">
			<div>
				<Input variant="primary" size="m" />
				<div class="popper">Подсказка</div>
			</div>
		</div>
	</div>
</div>
<Typography variant="body-m">Сверху представлен всплывающий элемент в scroll-контейнере</Typography>
