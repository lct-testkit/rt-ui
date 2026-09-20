<script lang="ts">
	import Slider from '$lib/components/Slider/Slider.svelte';
	import './styles.css';

	const getSubLabelInvest = (sls: number[]) => `${sls[0]} мес`;
	const getSubLabelVideo = (sls: number[]) => {
		if (sls[0] < 1024) {
			return `${sls[0]}kbps`;
		}
		return `${Math.floor(sls[0] / 1000)}Mbps`;
	};
</script>

<Slider
	label="Срок вклада"
	subLabel={getSubLabelInvest}
	max={36}
	min={1}
	value={[1]}
	marks={[
		{ label: '1 мес', value: 1 },
		{ label: '36 мес', value: 36 }
	]}
/>
<div style="padding-top: 100px; width: 100%">
	<Slider
		class="gradient-track"
		label="Битрейт видео"
		subLabel={getSubLabelVideo}
		max={16691}
		min={256}
		step={256}
		value={[256]}
		tooltip="always"
		marks={[
			{ label: '256kbps', value: 256 },
			{ label: '4Mbps', value: 4096 },
			{ label: '8Mbps', value: 8192 },
			{ label: '16Mbps', value: 16691 }
		]}
	/>
</div>
