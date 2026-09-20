// Port of packages/ui-kit/src/components/InputCard/constants.tsx
// (React kept ready-made elements in the map, Svelte holds the logotype COMPONENTS)
import type { Component } from 'svelte';
import AmExpress from '../Icons/logotypes/AmExpress.svelte';
import Discover from '../Icons/logotypes/Discover.svelte';
import JCB from '../Icons/logotypes/JCB.svelte';
import Maestro from '../Icons/logotypes/Maestro.svelte';
import Mastercard from '../Icons/logotypes/Mastercard.svelte';
import Mir from '../Icons/logotypes/Mir.svelte';
import UnionPay from '../Icons/logotypes/UnionPay.svelte';
import Visa from '../Icons/logotypes/Visa.svelte';

/** Payment system logotypes by the `card.type` of card-validator (types without a logotype have no icon). */
export const CARD_ICONS: Record<string, Component<any> | undefined> = {
	'american-express': AmExpress,
	discover: Discover,
	jcb: JCB,
	maestro: Maestro,
	mastercard: Mastercard,
	mir: Mir,
	unionpay: UnionPay,
	visa: Visa
};
