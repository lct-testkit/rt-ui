<script lang="ts">
	import './styles.css';
	import Input from '$lib/components/Input/Input.svelte';
	import DecorateStory from '../_utils/DecorateStory.svelte';

	const phoneLabel = 'Pattern (Phone) +{7}(000)000-00-00';
</script>

<DecorateStory>
	<form class="stories-input-form" method="dialog">
		<div>
			<Input required label={phoneLabel} name="inputFieldName" type="text" mask={'{+7} (000) 000-00-00'} value="9081234567" />
		</div>
		<div>
			<Input required label={phoneLabel} name="inputFieldName" type="text" mask={'{+7} 000 000-00-00'} maskPlaceholder />
		</div>
		<div>
			<Input
				required
				label="Pattern (Secure) XXX-XX-0000"
				name="inputFieldName"
				type="text"
				mask={{
					mask: 'XXX-XX-0000',
					blocks: { X: { mask: '0', displayChar: 'X', placeholderChar: '#' } },
					overwrite: 'shift'
				}}
			/>
		</div>
		<div>
			<Input required label="Date 'dd.mm.yyyy'" name="inputFieldName" type="text" mask={{ mask: Date }} />
		</div>
		<div>
			<Input
				required
				label="Mask in mask currency input"
				name="inputFieldName"
				type="text"
				mask={{ mask: '$num', blocks: { num: { mask: Number, thousandsSeparator: ' ' } } }}
			/>
		</div>
	</form>
</DecorateStory>
