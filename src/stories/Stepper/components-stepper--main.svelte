<script lang="ts">
	import Stepper from '$lib/components/Stepper/Stepper.svelte';
</script>

<!-- args.iconPrefix / args.iconSuffix are not set, so `icons[undefined]` is undefined and the default icons are used -->
<Stepper size="m" variant="primary" />
