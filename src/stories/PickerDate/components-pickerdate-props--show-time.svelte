<script lang="ts">
	// Port of stories/PickerDate/Props: ShowTime
	import './_styles.css';
	import PickerDate from '$lib/components/PickerDate/PickerDate.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import Sp from '../_utils/Sp.svelte';
</script>

<div>
	<Typography variant="heading-h2" style={{ marginBottom: 'var(--atmr-spacing-2x)' }}>ShowTime</Typography>
	<div class="stories-pickerdate-props-container">
		<div>
			<Typography variant="body-m" strong as="span">showTime=&#123;&nbsp;true&nbsp;&#125;</Typography>
			<PickerDate showTime />
		</div>
		<div>
			<Typography variant="body-m"
				><Typography variant="body-m" strong as="span">showTime=&#123;&nbsp;true&nbsp;&#125;</Typography><Sp />+<Sp /><Typography variant="body-m" strong as="span"
					>isRange=&#123;&nbsp;true&nbsp;&#125;</Typography
				></Typography
			>
			<PickerDate isRange showTime />
		</div>
	</div>

	<Typography variant="heading-h2" style={{ marginBottom: 'var(--atmr-spacing-2x)', marginTop: 'var(--atmr-spacing-4x)' }}>timeProps – настройка времени</Typography>
	<div class="stories-pickerdate-props-container">
		<div>
			<Typography variant="body-m"
				><Typography variant="body-m" strong as="span"
					>&#123;<br /><Typography variant="body-m" strong as="span">&nbsp; &nbsp; isRange: true,</Typography><br />&nbsp; &nbsp; interval: 15,<br />&nbsp; &nbsp; format: &quot;HH:mm&quot;<br />&#125;</Typography
				></Typography
			>
			<PickerDate showTime isRange timeProps={{ isRange: true, format: 'HH:mm', interval: 15 }} />
		</div>
		<div>
			<Typography variant="body-m"
				><Typography variant="body-m" strong as="span"
					>&#123;<br />&nbsp; &nbsp; isRange: false,<br /><Typography variant="body-m" strong as="span"><Sp />&nbsp; &nbsp; interval: 30,</Typography><br />&nbsp; &nbsp; format: &quot;HH:mm&quot;<br />&#125;</Typography
				></Typography
			>
			<PickerDate showTime timeProps={{ interval: 30, format: 'HH:mm', isRange: false }} />
		</div>
		<div>
			<Typography variant="body-m"
				><Typography variant="body-m" strong as="span"
					>&#123;<br />&nbsp; &nbsp; isRange: true,<br />&nbsp; &nbsp; interval: 15,<br /><Typography variant="body-m" strong as="span"><Sp />&nbsp; &nbsp; format: &quot;h:m&quot;</Typography><br />&#125;</Typography
				></Typography
			>
			<PickerDate isRange showTime timeProps={{ isRange: true, interval: 15, format: 'h:m' }} />
		</div>
	</div>
</div>
