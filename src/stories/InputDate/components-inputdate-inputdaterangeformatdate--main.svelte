<script lang="ts">
	// Port of stories/InputDate/InputDateRangeFormatDate
	import InputDate from '$lib/components/InputDate/InputDate.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';

	const handleChange = (date1?: Date, date2?: Date) => {
		if (!date1) {
			return;
		}
		console.log(date1.toDateString());
		if (date2) {
			date2.setHours(23, 59);
			console.log(date2);
		}
	};
</script>

<div>
	<Typography variant="body-m" color="red">
		По умолчанию в onChange возвращается две даты при isRange = true в виде объекта типа Date c установленным временем 00:00.{' '}
	</Typography>
	<Typography variant="body-m">
		Для того, чтобы при выборе двух соседних дней получать диапазон из двух суток можно воспользоваться стандартным набором методов из js.{' '}
	</Typography>
	<Typography variant="body-m">
		Например, получить только дату с помощью toDateString(), либо, второй метод, поставить часы для второго объекта 23:59 с помощью setHours(23, 59). Оба
		метода представлены в showCode.
	</Typography>
</div>
<InputDate isRange onChange={handleChange} style={{ width: '280px' }} />
