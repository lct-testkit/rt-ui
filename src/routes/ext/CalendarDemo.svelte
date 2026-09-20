<!-- EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. -->
<script lang="ts">
	/** EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. */
	// Live example of the calendar motion (src/lib/ext/calendarMotion.svelte.ts): PickerDate and InputDate. Every component is the ORIGINAL one; the
	// switch below sets the mode of a nested <ExtMotionProvider> ('Как на странице' = none: the page's own mode, off by default). With 'off' months and
	// years change in place, exactly like the original. With 'svelte' the grid slides + fades in the direction of the change (previous / next month or
	// year), the month / year labels slide in, a change of the view (day / month / year) zooms in and a selected day / range softens in; the popover
	// of the InputDate uses the overlay motion (scale + fade from its anchor corner). The last cell overrides the mode with the `motion` prop.
	import InputDate from '$lib/components/InputDate/InputDate.svelte';
	import PickerDate from '$lib/components/PickerDate/PickerDate.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import LocalMode from './LocalMode.svelte';

	// fixed dates: the demo (and tools/ext-check-new.py) must not depend on today's date
	const SHOWN = new Date(2026, 8, 15);
	const RANGE_A = new Date(2026, 8, 8);
	const RANGE_B = new Date(2026, 8, 14);
	let picked = $state('');
</script>

<LocalMode param="cal" id="cal">
	<div class="grid">
		<div class="cell" data-testid="cal-cell-day">
			<Typography variant="body-s" strong as="span">PickerDate · дни</Typography>
			<Typography variant="body-s" as="span" class="muted">Стрелки — соседние месяцы; клик по месяцу / году — другой вид.</Typography>
			<div data-testid="cal-day"><PickerDate activeDate={SHOWN} onSelect={(d: Date) => (picked = d.toLocaleDateString('ru-RU'))} /></div>
			<Typography variant="body-s" as="span" class="muted" data-testid="cal-picked">Выбрано: {picked || '—'}</Typography>
		</div>

		<div class="cell" data-testid="cal-cell-range">
			<Typography variant="body-s" strong as="span">PickerDate · период</Typography>
			<Typography variant="body-s" as="span" class="muted">Выделение дня и периода появляется плавно.</Typography>
			<div data-testid="cal-range"><PickerDate isRange activeDate={RANGE_A} secondDate={RANGE_B} /></div>
		</div>

		<div class="cell" data-testid="cal-cell-years">
			<Typography variant="body-s" strong as="span">PickerDate · годы + месяцы</Typography>
			<Typography variant="body-s" as="span" class="muted">Стрелки листают годы; сетка месяцев сдвигается.</Typography>
			<div data-testid="cal-years"><PickerDate calendarMode="YEARS_WITH_MONTH" defaultShownDate={SHOWN} /></div>
		</div>

		<div class="cell" data-testid="cal-cell-input">
			<Typography variant="body-s" strong as="span">InputDate</Typography>
			<Typography variant="body-s" as="span" class="muted">Календарь во всплывающем окне: то же движение, что у Popover.</Typography>
			<div class="field"><InputDate label="Дата" defaultShownDate={SHOWN} data-testid="cal-input" popoverClassName="cal-input-popover" /></div>
		</div>

		<div class="cell" data-testid="cal-cell-prop">
			<Typography variant="body-s" strong as="span">{'motion={false}'}</Typography>
			<Typography variant="body-s" as="span" class="muted">Проп сильнее режима: всегда оригинал.</Typography>
			<div data-testid="cal-off"><PickerDate activeDate={SHOWN} motion={false} /></div>
		</div>

		<div class="cell" data-testid="cal-cell-slow">
			<Typography variant="body-s" strong as="span">{'motion={{ duration: 900 }}'}</Typography>
			<Typography variant="body-s" as="span" class="muted">Всегда Svelte и медленно (Tween, 900 мс).</Typography>
			<div data-testid="cal-slow"><PickerDate activeDate={SHOWN} motion={{ duration: 900 }} /></div>
		</div>
	</div>
</LocalMode>

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: var(--atmr-spacing-3x);
	}
	.cell {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--atmr-spacing-2x);
		min-width: 0;
		padding: var(--atmr-spacing-3x) var(--atmr-spacing-4x);
		border-radius: var(--atmr-border-radius-l);
		border: var(--atmr-border-width-s) solid var(--atmr-border-soft);
		background: var(--atmr-neutral-container-soft);
	}
	.field {
		width: 100%;
	}
</style>
