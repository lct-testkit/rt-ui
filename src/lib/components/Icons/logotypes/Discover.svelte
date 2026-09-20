<script lang="ts">
	// Port of packages/ui-kit/src/components/Icons/logotypes/Discover.tsx
	import Base from '../../../icons/Icon.svelte';
	let props: Record<string, any> = $props();
</script>

<Base {...props}>
	<g xmlns="http://www.w3.org/2000/svg" filter="url(#filter0_i_21591_381974)">
		<circle cx="12" cy="12" r="10" fill="url(#paint0_linear_21591_381974)" />
	</g>
	<defs xmlns="http://www.w3.org/2000/svg">
		<filter id="filter0_i_21591_381974" x="2" y="2" width="21.7391" height="21.7391" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
			<feFlood flood-opacity="0" result="BackgroundImageFix" />
			<feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
			<feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
			<feOffset dx="1.73913" dy="1.73913" />
			<feGaussianBlur stdDeviation="0.869565" />
			<feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
			<feColorMatrix type="matrix" values="0 0 0 0 0.501961 0 0 0 0 0.145098 0 0 0 0 0.101961 0 0 0 0.74 0" />
			<feBlend mode="normal" in2="shape" result="effect1_innerShadow_21591_381974" />
		</filter>
		<linearGradient id="paint0_linear_21591_381974" x1="4.17391" y1="5.26087" x2="18.7391" y2="19.8261" gradientUnits="userSpaceOnUse">
			<stop offset="0.213542" stop-color="#DF471F" />
			<stop offset="1" stop-color="#F59314" />
		</linearGradient>
	</defs>
</Base>
