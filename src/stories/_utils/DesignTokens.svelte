<script lang="ts">
	// Shared render of the nine "Design Tokens" story files of stories-app (Animation, Border x2, Breakpoint, Colors, Shadow, Size,
	// Spacing, Typography, ZIndex): `tokensDecorator` (fetch the token source of the selected theme) + `useTokensByName(category, index)` +
	// the common `.design-tokens` table markup. The stories differ only in the props below (see src/stories/Design Tokens/*.svelte).
	// Until a theme resolves (always the case in the reference build) nothing is rendered, exactly like `tokensByCategory && <Box>...`.
	import Box from '$lib/components/Box/Box.svelte';
	import IconButton from '$lib/components/Button/IconButton/IconButton.svelte';
	import Typography from '$lib/components/Typography/Typography.svelte';
	import Copy16 from '$lib/icons/16/action/Copy16.svelte';
	import { copyToClipboard } from '$lib/hooks/useCopyClipboard.js';
	import {
		colorCategoriesMap,
		getThemeName,
		groupTokens,
		loadTokens,
		stringToPascalCase,
		tokensByName,
		type AllTokens,
		type Token
	} from './designTokens.js';

	interface Props {
		/** `useTokensByName` category */
		category: string;
		/** index of the name part the tokens are grouped by (`useTokensByName` 2nd argument) */
		index?: number;
		/** group heading: `stringToPascalCase(name)` or `colorCategoriesMap[name]` (none: rows only) */
		heading?: 'pascal' | 'color';
		/** `.design-tokens__preview` cell: before the token name (radius, border, color, shadow) or after the value (size, spacing, font) */
		preview?: 'radius' | 'border' | 'color' | 'shadow' | 'size' | 'spacing' | 'font';
		/** trailing description cell (the size / spacing / font pages show a preview there instead) */
		description?: boolean;
		/** margin-right of the copy button */
		iconMargin?: string;
		/** Typography page: the group `sortedTokens[regroup]` is split again by the 5th name part */
		regroup?: string;
	}

	let { category, index = 3, heading, preview, description = false, iconMargin = '12px', regroup }: Props = $props();

	let allTokens = $state<AllTokens>();
	$effect(() => {
		let cancelled = false;
		loadTokens(getThemeName()).then(
			(tokens) => {
				if (!cancelled && tokens) allTokens = tokens;
			},
			(error) => console.error(error)
		);
		return () => {
			cancelled = true;
		};
	});

	const found = $derived(tokensByName(allTokens, category, index));
	const groups = $derived.by<Record<string, Token[]>>(() => {
		const sorted = found.sortedTokens;
		if (!sorted) return {};
		return regroup ? groupTokens(sorted[regroup] ?? [], 4) : sorted;
	});

	const PREVIEW_BEFORE = ['radius', 'border', 'color', 'shadow'];
</script>

{#snippet previewCell(item: Token)}
	{#if preview === 'radius'}
		<Box class="design-tokens__preview" flex flexGrow="0" flexShrink="0" bg="atmr-accent-muted" borderRadius={item.value} style={{ width: '32px', height: '32px', marginRight: '12px' }} />
	{:else if preview === 'border'}
		<Box
			class="design-tokens__preview"
			flex
			flexGrow="0"
			flexShrink="0"
			style={{ border: `${item.value} solid var(--atmr-accent-muted)`, width: '32px', height: '32px', marginRight: '12px' }}
		/>
	{:else if preview === 'color'}
		<Box class="design-tokens__preview" flex flexGrow="0" flexShrink="0" bg={item.value} borderRadius="atmr-border-radius-s" style={{ width: '32px', height: '32px', marginRight: '12px' }} />
	{:else if preview === 'shadow'}
		<Box
			class="design-tokens__preview"
			flex
			flexGrow="0"
			flexShrink="0"
			bg="atmr-bg-surface1"
			borderRadius="atmr-border-radius-s"
			style={{ width: '32px', height: '32px', marginRight: '12px', boxShadow: item.value }}
		/>
	{:else if preview === 'size'}
		<Box class="design-tokens__preview" flex flexGrow="0" flexShrink="0" bg="atmr-accent-muted" style={{ width: item.value, height: item.value }} />
	{:else if preview === 'spacing'}
		<Box class="design-tokens__preview" flex flexGrow="0" flexShrink="0" bg="atmr-accent-muted" style={{ width: item.value, height: '24px' }} />
	{:else if preview === 'font'}
		<Box class="design-tokens__preview" flex flexGrow="0" flexShrink="0" style={{ font: item.value }}>Rostelecom Basis</Box>
	{/if}
{/snippet}

{#if found.tokensByCategory}
	<Box class="design-tokens">
		{#each Object.entries(groups) as [name, items]}
			{#if heading}
				<Box class="design-tokens__name" mb="24px">
					<Typography variant="heading-h4" as="h4">{heading === 'color' ? colorCategoriesMap[name] : stringToPascalCase(name)}</Typography>
				</Box>
			{/if}
			{#each items as item}
				<Box class="design-tokens__row" flex flexDirection="column" justifyContent="between">
					<Box flex alignItems="center" class="design-tokens__inner">
						<IconButton
							onclick={() => copyToClipboard(item.name)}
							size="s"
							type="button"
							variant="ghost"
							colorScheme="neutral"
							aria-label="copy"
							title="Скопировать"
							style="margin-right: {iconMargin}; width: 20px; height: 24px"
						>
							{#snippet icon()}<Copy16 />{/snippet}
						</IconButton>
						{#if preview && PREVIEW_BEFORE.includes(preview)}{@render previewCell(item)}{/if}
						<Box class="design-tokens__token" flex flexGrow="0" flexShrink="0" flexBasis="240px" style={{ marginRight: '16px' }}>
							<Typography variant="body-s">{item.name}</Typography>
						</Box>
						<Box class="design-tokens__value" flex flexGrow="0" flexShrink="0" flexBasis="200px" style={{ marginRight: '16px' }}>
							<Box tag="span" bg="atmr-bg-surface3" borderRadius="atmr-border-radius-xs" py="2px" px="4px">
								<Typography variant="body-s">{item.rawValue}</Typography>
							</Box>
						</Box>
						{#if preview && !PREVIEW_BEFORE.includes(preview)}{@render previewCell(item)}{/if}
						{#if description}
							<Box class="design-tokens__description">
								<Typography variant="body-s">{item.description}</Typography>
							</Box>
						{/if}
					</Box>
					<Box class="design-tokens__divider" />
				</Box>
			{/each}
		{/each}
	</Box>
{/if}
