/** EXTENSION — author's addition, NOT part of the original Rostelecom design system. Off by default. */
// Public entry of the chart module:  import { LineChart, BarChart, DonutChart, PieChart, Sparkline } from '@lct-testkit/rt-ui/charts';
// (in this repository: '$lib/charts'). Not part of the main barrel: a consumer that does not import it pays nothing. See ./README.md.
export { default as LineChart } from './LineChart.svelte';
export { default as BarChart } from './BarChart.svelte';
export { default as DonutChart } from './DonutChart.svelte';
export { default as PieChart } from './PieChart.svelte';
export { default as Sparkline } from './Sparkline.svelte';
// building blocks: use them to compose your own chart, a custom legend or a tooltip
export { default as Legend } from './Legend.svelte';
export { default as ChartTooltip } from './ChartTooltip.svelte';
export { default as Axis } from './Axis.svelte';
export { default as Grid } from './Grid.svelte';

export { chartColor, chartRamp, CHART_COLOR_COUNT, CHART_OTHER_COLOR, type RampHue } from './internal/palette.js';
export { niceTicks, niceStep, fitTicks, timeTicks, linearScale, tickCountFor, type NiceTicks, type TimeTicks, type LinearScale } from './internal/scale.js';
export {
	createNumberFormat,
	createCompactFormat,
	createPercentFormat,
	createLongDateFormat,
	createMonthYearFormat,
	createTickDateFormat,
	DEFAULT_LOCALE,
	type NumberFormatter,
	type DateFormatter
} from './internal/format.js';
export { CHART_MOTION_KIND } from './internal/motion.svelte.js';
export type * from './types.js';
