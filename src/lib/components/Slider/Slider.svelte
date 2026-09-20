<script lang="ts">
	// Port of packages/ui-kit/src/components/Slider/Slider.tsx
	// (the module only exists inside the stories bundle of the React storybook; hooks in ./hooks.svelte.ts, the track and the
	// thumbs in ./components, the shared state in ./context.ts)
	//
	// A range slider with one or several thumbs. Like in React the value is UNCONTROLLED: `value` is only the initial
	// value, `onChange(values)` / `onStart(values)` / `onEnd(values)` report the changes.
	//
	// Differences to React that come from the platform (behaviour is the same):
	//  * `className` is `class`; `label` accepts a snippet, a string or a number
	//  * `subLabel(values)` returns the text of the counter next to the label
	//  * extra attributes are not applied to any element (React collected them in `otherProps` but never rendered them)
	import clsx from 'clsx';
	import { untrack } from 'svelte';
	import Slot from '../../internal/Slot.svelte';
	import type { Content } from '../../internal/types.js';
	import { noop } from '../../utils/function.js';
	import SliderThumb from './components/SliderThumb.svelte';
	import SliderTrack from './components/SliderTrack.svelte';
	import { DEFAULT_SIZE, DEFAULT_VARIANT, type SliderSize, type SliderVariant } from './constants.js';
	import { setSliderContext } from './context.js';
	import { arraysNumbersEqual, hasDuplicates } from './helpers.js';
	import { useSlider, useSteps, type SliderMark } from './hooks.svelte.js';
	import { getOffset } from './utils.js';
	// [ext, not in original] author's motion extension (off by default, see src/lib/ext/README.md)
	import { useMotion, useMotionValue, usePressTracker, type MotionProp } from '../../ext/motion.svelte.js';

	export type { SliderMark };
	export type SliderTrackVariant = 'normal' | 'inverted';
	export type SliderTooltip = 'always' | 'hover';

	export interface SliderProps {
		/** Минимальное значение */
		min?: number;
		/** Максимальное значение */
		max?: number;
		/** Метки на треке (у меток с `label` показывается подпись) */
		marks?: SliderMark[];
		/** Шаг (0 - значение не округляется) */
		step?: number;
		/** Лейбл */
		label?: Content;
		/** Функция, которая возвращает текст счетчика рядом с лейблом; получает текущие значения */
		subLabel?: (value: number[]) => string | number;
		/** Блокирует слайдер */
		disabled?: boolean;
		/** Размер */
		size?: SliderSize;
		/** Вариант */
		variant?: SliderVariant;
		/** Начальные значения ползунков (один ползунок - одно значение) */
		value?: number[];
		/** Показывать точки на месте каждого шага */
		dots?: boolean;
		/** Направление закраски трека */
		track?: SliderTrackVariant;
		/** Показ подсказки со значением над ползунком */
		tooltip?: SliderTooltip;
		/** Запрещает ползункам перетаскиваться друг через друга */
		disableSwap?: boolean;
		/** Изменение значений (получает массив значений) */
		onChange?: (values: number[]) => void;
		/** Начало перетаскивания (получает массив значений) */
		onStart?: (values: number[]) => void;
		/** Конец перетаскивания (получает массив значений) */
		onEnd?: (values: number[]) => void;
		/**
		 * [ext, not in original] Плавное движение ползунков, заливки трека и числа в подсказке (Svelte Tween / Spring).
		 * undefined = как у ExtMotionProvider (без него выключено), false = выключено, true / 'tween' / 'spring' / объект
		 * опций = включено. При включении перетаскивание остаётся мгновенным, а проп `value` следит за внешними
		 * изменениями (в оригинале `value` - только начальное значение). Не работает при prefers-reduced-motion: reduce.
		 */
		motion?: MotionProp;
		class?: string;
		[key: string]: unknown;
	}

	let {
		min: minProp = 0,
		max: maxProp = 100,
		marks: marksProp = [],
		step = 1,
		label,
		subLabel,
		disabled = false,
		size = DEFAULT_SIZE,
		variant = DEFAULT_VARIANT,
		value: valueProp = [0],
		dots = false,
		track = 'normal',
		tooltip,
		disableSwap = false,
		onChange = noop,
		onStart = noop,
		onEnd = noop,
		motion,
		class: className
	}: SliderProps = $props();

	const id = $props.id();

	// element refs (React refs are not reactive)
	let thumbRefs = $state.raw<Array<HTMLDivElement | null>>([]);
	let trackEl = $state<HTMLDivElement | null>(null);
	const currentIndex = { current: 0 };

	let internalValue = $state.raw<number[]>(untrack(() => valueProp));

	/** Обновляем индекс активного тамба */
	function updateCurrentIndex() {
		currentIndex.current = thumbRefs.findIndex((tr) => tr === activeThumbRef.current);
	}

	/** Функция для получения активного тамба */
	function getActiveThumb(e: MouseEvent | TouchEvent): HTMLElement | undefined {
		if (!thumbRefs.length || thumbRefs.some((tr) => !tr)) return;

		/** Получаем массив расстояний от точки клика до каждого ползунка */
		const thumbsOffset = thumbRefs.map((t) => getOffset(e, t as HTMLElement));
		const formatOffset = thumbsOffset.map((o) => Math.abs(o));

		/** Находим индекс самого ближайшего ползунка к точке клика */
		const minIndex = formatOffset.reduce((minIdx, currentValue, index, arr) => (currentValue < arr[minIdx] ? index : minIdx), 0);

		/** Если все элементы равны */
		if (formatOffset.every((o) => o === formatOffset[0])) {
			/** и все элементы равны нулю */
			if (formatOffset.every((o) => o === 0)) {
				/** берем последний элемент */
				return thumbRefs[thumbRefs.length - 1] as HTMLElement;
				/** Иначе если клик был в левую сторону */
			}
			if (thumbsOffset[0] < 0) {
				/** берем первый элемент */
				return thumbRefs[0] as HTMLElement;
			}
			/** иначе берем последний */
			return thumbRefs[thumbRefs.length - 1] as HTMLElement;

			/** иначе проверяем есть ли дубликаты(такое происходит когда 2 ползунка стоят в одной точке или равноудалены от точки клика, а третий ползунок стоит в другом месте) */
		}
		if (hasDuplicates(formatOffset, formatOffset[minIndex])) {
			/** проверяем дубликат стоит справа */
			if (formatOffset[minIndex] === formatOffset[minIndex + 1]) {
				/** проверяем клик произвошел влево */
				if (thumbsOffset[minIndex] < 0) {
					/** берем ползунок по мин индексу */
					return thumbRefs[minIndex] as HTMLElement;
					/** или вправо */
				}
				/** или берем следующий после него */
				return thumbRefs[minIndex + 1] as HTMLElement;

				/** или слева */
			}
			if (formatOffset[minIndex] === formatOffset[minIndex - 1]) {
				/** проверяем клик произвошел влево */
				if (thumbsOffset[minIndex] < 0) {
					/** берем ползунок предыдущий мин индексу */
					return thumbRefs[minIndex - 1] as HTMLElement;
					/** или вправо */
				}
				/** берем ползунок по мин индексу */
				return thumbRefs[minIndex] as HTMLElement;
			}
		} else {
			return thumbRefs[minIndex] as HTMLElement;
		}
	}

	const steps = useSteps(() => ({ min: minProp, max: maxProp, step }));
	const value = $derived(!internalValue.length ? [0, 0] : internalValue.map((v) => steps.roundValue(v)));

	const sliderData = useSlider({
		props: () => ({ track, dots, marks: marksProp, disabled, size }),
		steps,
		getTrack: () => trackEl,
		onSliderStart() {
			onStart(internalValue);
		},
		onSliderEnd({ value: v }) {
			const sliderValues = [...internalValue];
			sliderValues[currentIndex.current] = v;
			onEnd(sliderValues);
		},
		onSliderMove({ value: val }) {
			updateCurrentIndex();
			const prev = internalValue;
			const values = [...prev];
			const v = val;

			/** Сработает если разрешено перетаскиваение ползунков друг через друга,
			 * а так же проверяет есть ли дубликаты по значению слева и справа от активного ползунка
			 * (то есть при перетаскивании они оказались в одной точке) */
			if (
				!disableSwap &&
				((values[currentIndex.current - 1] === values[currentIndex.current] && values[currentIndex.current - 1] !== min) ||
					(values[currentIndex.current] === values[currentIndex.current + 1] && values[currentIndex.current + 1] !== min))
			) {
				/** Если дубликат одновременно справа и слева (такое происходит когда в одной точке 3 ползунка) */
				if (values[currentIndex.current] === values[currentIndex.current + 1] && values[currentIndex.current] === values[currentIndex.current - 1]) {
					/** Тут узнаем в какую сторону мы его тащим, данное условие сработает если тащим влево */
					if (v < values[currentIndex.current]) {
						/** Если дошли до сюда то получается что ползунок мы тащим влево а в точке у нас стоит более 3 ползунков
						 * Тут нам нужно найти самый левый дубликат, т.е. ползунок с тем же значением который мы сейчас тащим но
						 * самый ближайщий в левую сторону, находим его индекс и обновляем индекс текущего */
						const index = values.findIndex((num) => num === values[currentIndex.current]);
						activeThumbRef.current = thumbRefs[index] ?? thumbRefs[0] ?? undefined;
						updateCurrentIndex();
					}
					/** Вправо */
					if (v > values[currentIndex.current]) {
						/** То же самое что и в предыдущем условии только ищем индекс с конца т.к двигаем ползунок уже вправо */
						const index = values.findLastIndex((num) => num === values[currentIndex.current]);
						activeThumbRef.current = thumbRefs[index] ?? thumbRefs[0] ?? undefined;
						updateCurrentIndex();
					}
				}
				/** Двигаем ползунок влево и справа дубликата нет */
				if (v < values[currentIndex.current] && values[currentIndex.current + 1] !== values[currentIndex.current]) {
					activeThumbRef.current = thumbRefs[currentIndex.current - 1] ?? thumbRefs[0] ?? undefined;
					updateCurrentIndex();
					/** Двигаем ползунок вправо и слева дубликата нет */
				} else if (v > values[currentIndex.current] && values[currentIndex.current - 1] !== values[currentIndex.current]) {
					activeThumbRef.current = thumbRefs[currentIndex.current + 1] ?? thumbRefs[thumbRefs.length - 1] ?? undefined;
					updateCurrentIndex();
				}
				activeThumbRef?.current?.focus();
			}

			/** Сюда попадаем если disableSwap=true или мы уже прошли всю цепочку условий
			 * и определили активный ползунок */

			/** Тут уже зная активный индекс мы просто обновляем значение
			 * Math.min/Math.max служат как ограничители чтобы ползунок не пересекал значение другого */
			if (currentIndex.current === 0) {
				if (internalValue.length === 1) {
					values[currentIndex.current] = v;
				} else {
					values[currentIndex.current] = Math.min(v, values[currentIndex.current + 1]);
				}
			} else if (currentIndex.current === values.length - 1) {
				values[currentIndex.current] = Math.max(v, values[currentIndex.current - 1]);
			} else {
				const tmp = Math.max(v, values[currentIndex.current - 1]);
				values[currentIndex.current] = Math.min(tmp, values[currentIndex.current + 1]);
			}
			if (!arraysNumbersEqual(prev, values)) onChange(values);
			internalValue = values;
		},
		getActiveThumb
	});
	setSliderContext(sliderData);

	const activeThumbRef = sliderData.activeThumbRef;
	const min = $derived(sliderData.min);
	const max = $derived(sliderData.max);
	const position = sliderData.position;
	const marks = $derived(sliderData.marks);

	// ─── [ext, not in original] motion ─────────────────────────────────────────────────────────────────────────────────
	// Off (the default; also under prefers-reduced-motion): `shownPositions` are exactly `position(v)` and `displayValues` is
	// undefined, so the markup below is the original one. On: the thumbs, the fill and the tooltip number follow the values
	// with a Svelte Tween / Spring, except while the slider is being dragged (pointer down on a thumb / pointer moving).
	const motionH = useMotion(() => motion, 'slider');
	const press = usePressTracker({
		enabled: () => motionH.enabled,
		isThumb: (t) => t instanceof Node && thumbRefs.some((r) => !!r && r.contains(t))
	});
	const targetPositions = $derived(value.map((v) => position(v)));
	const anim = useMotionValue(
		() => targetPositions,
		() => motionH.config,
		() => press.immediate
	);
	const shownPositions = $derived(motionH.enabled ? anim.current.map((p) => Math.min(100, Math.max(0, p))) : targetPositions);
	/** tooltip numbers while animating (at rest they are exactly `value`); undefined while motion is off */
	const displayValues = $derived(
		motionH.enabled
			? shownPositions.map((p, i) => {
					if (p === targetPositions[i]) return value[i];
					const raw = min + (p / 100) * (max - min);
					return steps.step > 0 ? steps.roundValue(raw) : Number(raw.toFixed(2));
				})
			: undefined
	);
	// with motion on the `value` prop follows outside changes (the original reads it once, as the initial value)
	$effect.pre(() => {
		const next = valueProp;
		if (!motionH.requested) return;
		untrack(() => {
			if (next.length && !arraysNumbersEqual(internalValue, next)) internalValue = [...next];
		});
	});

	const trackStart = $derived(shownPositions[0]);
	const trackStop = $derived(shownPositions[shownPositions.length - 1]);

	function updateValue(v: number, index: number) {
		const newArray = [...internalValue];
		newArray[index] = v;
		onChange(newArray);
		internalValue = newArray;
	}

	const rootClassName = $derived(
		clsx(
			'atmr-slider',
			`atmr-slider--size-${size}`,
			`atmr-slider--${variant}`,
			`atmr-slider--track-${track}`,
			{
				'atmr-slider--disabled': disabled,
				[`atmr-slider--show-tooltip-${tooltip}`]: tooltip
			},
			className && className
		)
	);

	function handleThumbFocus(e: FocusEvent, index: number) {
		// focus()
		/** Фокус срабатывет каждый раз при смене индекса или при клике мышкой */
		e.preventDefault();
		if (value.length === 1) return;
		activeThumbRef.current = thumbRefs[index] ?? undefined;

		/** Определяем все ли ползунки стоят в одной точке */
		if (value.every((o) => o === value[0])) {
			/** Если все стоят в начале слайдера и в relatedTarget не содержится послдений элемент
			 * то мы сами его выбираем именно последний */
			if (value[0] === min && e.relatedTarget !== thumbRefs[thumbRefs.length - 1]) {
				thumbRefs[0]?.blur();
				thumbRefs[thumbRefs.length - 1]?.focus();
			}
			/** Если не все стоят в одной точке тогда проверяем есть ли
			 * несколько элементов которые стоят в начале слайдера, то есть в 0 */
		} else if (hasDuplicates(value, min) && value[index] === min) {
			/** Если есть такие элементы то мы находим индекс самого последнего
			 * проверяем не выбран ли уже он, если нет то возводим его в фокус */
			const tmp = [...value];
			const indexReversed = tmp.reverse().findIndex((o) => o === min);
			const lastDuplicateIndex = value.length - 1 - indexReversed;
			if (e.relatedTarget !== thumbRefs[lastDuplicateIndex]) {
				thumbRefs.forEach((tr, i) => i > lastDuplicateIndex && tr?.blur());
				thumbRefs[lastDuplicateIndex]?.focus();
			}
		}

		/** Тут то же самое что и выше только проверяется уже что ползунки стоят не вначале а в конце */
		if (value.every((o) => o === value[0])) {
			if (value[0] === max && e.relatedTarget !== thumbRefs[0]) {
				thumbRefs[thumbRefs.length - 1]?.blur();
				thumbRefs[0]?.focus();
			}
		} else if (hasDuplicates(value, max) && value[index] === max) {
			const tmp = [...value];
			const indexReversed = tmp.reverse().findIndex((o) => o === max);
			const lastDuplicateIndex = value.length - 1 + indexReversed;
			if (e.relatedTarget !== thumbRefs[lastDuplicateIndex]) {
				thumbRefs.forEach((tr, i) => i < lastDuplicateIndex && tr?.blur());
				thumbRefs[lastDuplicateIndex]?.focus();
			}
		}
	}

	function handleThumbBlur() {
		// blur();
		activeThumbRef.current = undefined;
	}
</script>

<div
	class={rootClassName}
	data-testid="slider"
	role="group"
	aria-labelledby={`slider-label-${id}`}
	aria-describedby={subLabel ? `slider-description-${id}` : undefined}
	aria-orientation="horizontal"
>
	<div class="atmr-slider__header">
		<div id={`slider-label-${id}`} class="atmr-slider__label"><Slot content={label} /></div>
		{#if subLabel}
			<div id={`slider-description-${id}`} class="atmr-slider__counter">{subLabel(value)}</div>
		{/if}
	</div>
	<div
		class="atmr-slider__container"
		onmousedown={(e) => {
			if (disabled) return;
			press.start(e); // [ext] no-op while motion is off
			sliderData.onSliderMousedown(e);
		}}
		ontouchstart={(e) => {
			if (disabled) return;
			press.start(e); // [ext] no-op while motion is off
			sliderData.onSliderTouchstart(e);
		}}
	>
		{#each value as v, i (i)}
			<input class="atmr-slider__input" id={`input-${i}-${id}`} name="atmr-slider" {disabled} tabindex="-1" value={value[i]} type="hidden" />
		{/each}
		<SliderTrack bind:ref={trackEl} start={value.length === 1 ? 0 : trackStart} stop={trackStop} />
		{#each value as v, index (index)}
			<SliderThumb
				bind:ref={() => thumbRefs[index] ?? null, (el) => (thumbRefs[index] = el)}
				min={index === 0 ? min : value[index - 1]}
				max={index === value.length - 1 ? max : value[index + 1]}
				value={v}
				setValue={(val) => updateValue(val, index)}
				position={shownPositions[index]}
				display={displayValues?.[index]}
				onFocus={(e) => handleThumbFocus(e, index)}
				onBlur={handleThumbBlur}
			/>
		{/each}
	</div>
	{#if marks?.length}
		<div class="atmr-slider__space"></div>
	{/if}
</div>
