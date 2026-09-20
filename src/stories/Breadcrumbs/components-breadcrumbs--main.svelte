<script lang="ts">
	// Port of stories/Breadcrumbs Main ("Breadcrumbs"): args { size: 's', variant: 'primary', children: 6 } -> six "Хлебная крошка N" links
	import Breadcrumbs from '$lib/components/Breadcrumbs/Breadcrumbs.svelte';
</script>

<!-- React renders `Хлебная крошка {i + 1}` as two separate text nodes: the number goes through a block -->
{#snippet crumb1()}<a href="#link1">Хлебная крошка {#each [1] as n}{n}{/each}</a>{/snippet}
{#snippet crumb2()}<a href="#link2">Хлебная крошка {#each [2] as n}{n}{/each}</a>{/snippet}
{#snippet crumb3()}<a href="#link3">Хлебная крошка {#each [3] as n}{n}{/each}</a>{/snippet}
{#snippet crumb4()}<a href="#link4">Хлебная крошка {#each [4] as n}{n}{/each}</a>{/snippet}
{#snippet crumb5()}<a href="#link5">Хлебная крошка {#each [5] as n}{n}{/each}</a>{/snippet}
{#snippet crumb6()}<a href="#link6">Хлебная крошка {#each [6] as n}{n}{/each}</a>{/snippet}

<Breadcrumbs size="s" variant="primary" children={[crumb1, crumb2, crumb3, crumb4, crumb5, crumb6]} />
