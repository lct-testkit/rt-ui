// Checks what CSS a CONSUMER of the built package (dist/, run `npm run package` first) gets from the author's extension (src/lib/ext):
//
//   node tools/check-ext-css.mjs
//
// Three tiny consumer apps are bundled with Vite (in memory) against dist/:
//   plain     imports every extension-aware component (Modal, Drawer, Popover, Tooltip, DropdownMenu, Select, Tabs, Accordion, SideMenu, PickerDate, InputDate,
//             Wizard, the toast provider ...) but NOT the extension entry           -> its CSS must contain NO motion CSS (`rt-ext-wizard-step`, `rt-ext-toast`,
//                                                                                      `rt-ext-tabs`, `rt-ext-side-menu`) and, because Modal / Drawer are in it, only the
//                                                                                      tiny layout parts (`rt-ext-modal--full`, `rt-ext-drawer--full`)
//   modal     imports only Modal                                                    -> `rt-ext-modal--full` but NOT `rt-ext-drawer--full` (each has its own file)
//   popover   imports only Popover / Tabs (no Modal, no Drawer)                     -> NO `rt-ext-` anywhere
//   ext       imports the extension entry (`dist/ext/index.js`)                     -> the motion CSS IS there
// Exit code 0 = all as required.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
if (!fs.existsSync(path.join(dist, 'ext', 'ext.css'))) {
	console.error('dist/ext/ext.css not found: run `npm run package` first');
	process.exit(2);
}
const tmp = path.join(root, 'tools', '.tmp-ext-css');
fs.rmSync(tmp, { recursive: true, force: true });
fs.mkdirSync(tmp, { recursive: true });

const imp = (name, file) => `import ${name} from ${JSON.stringify(path.join(dist, file).split(path.sep).join('/'))};`;
const use = (...names) => `console.log(${names.join(', ')});`;
const ENTRIES = {
	plain: [
		imp('Modal', 'components/Modal/Modal.svelte'),
		imp('Drawer', 'components/Drawer/Drawer.svelte'),
		imp('Popover', 'components/Popover/Popover.svelte'),
		imp('Tooltip', 'components/Tooltip/Tooltip.svelte'),
		imp('DropdownMenu', 'components/DropdownMenu/DropdownMenu.svelte'),
		imp('Select', 'components/Select/Select.svelte'),
		imp('TabsGroup', 'components/Tabs/TabsGroup/TabsGroup.svelte'),
		imp('TabsPanel', 'components/Tabs/TabsPanel/TabsPanel.svelte'),
		imp('AccordionDetails', 'components/Accordion/AccordionDetails/AccordionDetails.svelte'),
		imp('SideMenu', 'components/SideMenu/SideMenu.svelte'),
		imp('SideMenuExpandContent', 'components/SideMenu/SideMenuExpandContent.svelte'),
		imp('PickerDate', 'components/PickerDate/PickerDate.svelte'),
		imp('InputDate', 'components/InputDate/InputDate.svelte'),
		imp('Slider', 'components/Slider/Slider.svelte'),
		imp('Wizard', 'components/Wizard/WizardStepsHorizontal/WizardStepsHorizontal.svelte'),
		imp('Toasts', 'components/wrappers/ToastNotificationsProvider/ToastNotificationsProvider.svelte'),
		use('Modal', 'Drawer', 'Popover', 'Tooltip', 'DropdownMenu', 'Select', 'TabsGroup', 'TabsPanel', 'AccordionDetails', 'SideMenu', 'SideMenuExpandContent', 'PickerDate', 'InputDate', 'Slider', 'Wizard', 'Toasts')
	],
	modal: [imp('Modal', 'components/Modal/Modal.svelte'), use('Modal')],
	popover: [imp('Popover', 'components/Popover/Popover.svelte'), imp('TabsGroup', 'components/Tabs/TabsGroup/TabsGroup.svelte'), use('Popover', 'TabsGroup')],
	ext: [`import { ExtMotionProvider } from ${JSON.stringify(path.join(dist, 'ext/index.js').split(path.sep).join('/'))};`, use('ExtMotionProvider')]
};

const MOTION = ['rt-ext-wizard-step', 'rt-ext-toast', 'rt-ext-tabs', 'rt-ext-side-menu'];
const LAYOUT = ['rt-ext-modal--full', 'rt-ext-drawer--full'];

async function cssOf(name, lines) {
	const dir = path.join(tmp, name);
	fs.mkdirSync(dir, { recursive: true });
	fs.writeFileSync(path.join(dir, 'main.js'), lines.join('\n') + '\n');
	fs.writeFileSync(path.join(dir, 'index.html'), '<!doctype html><script type="module" src="./main.js"></script>');
	const res = await build({
		root: dir,
		configFile: false,
		logLevel: 'silent',
		clearScreen: false,
		plugins: [svelte({ configFile: false, onwarn: () => {}, compilerOptions: { runes: true } })],
		resolve: { dedupe: ['svelte'] },
		build: { write: false, minify: false, cssMinify: false, assetsInlineLimit: 0, chunkSizeWarningLimit: 100000 }
	});
	const outputs = (Array.isArray(res) ? res : [res]).flatMap((r) => r.output);
	return outputs.filter((o) => o.type === 'asset' && o.fileName.endsWith('.css')).map((o) => String(o.source)).join('\n');
}

const rows = [];
const check = (name, ok, detail = '') => {
	rows.push(ok);
	console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `   [${detail}]` : ''}`);
};
const found = (css, list) => list.filter((m) => css.includes(m));

try {
	const plain = await cssOf('plain', ENTRIES.plain);
	const modal = await cssOf('modal', ENTRIES.modal);
	const pop = await cssOf('popover', ENTRIES.popover);
	const ext = await cssOf('ext', ENTRIES.ext);
	check('consumer without the extension entry: no motion CSS', found(plain, MOTION).length === 0, found(plain, MOTION).join(', '));
	check('  ... the layout part (fullHeight of Modal / Drawer) is there', LAYOUT.every((m) => plain.includes(m)), `${(plain.length / 1024).toFixed(1)} KB of CSS`);
	check('consumer of Modal only: just the Modal layout rules (no Drawer rules, no motion CSS)', modal.includes('rt-ext-modal--full') && !modal.includes('rt-ext-drawer--full') && found(modal, MOTION).length === 0);
	check('consumer of Popover / Tabs only: no `rt-ext-` CSS at all', !pop.includes('rt-ext-'), found(pop, [...MOTION, ...LAYOUT]).join(', '));
	check('consumer of the extension entry: the motion CSS is there', MOTION.every((m) => ext.includes(m)), MOTION.filter((m) => !ext.includes(m)).join(', ') || `${(ext.length / 1024).toFixed(1)} KB`);
} finally {
	fs.rmSync(tmp, { recursive: true, force: true });
}
const bad = rows.filter((x) => !x).length;
console.log(`\n${rows.length - bad}/${rows.length} checks passed`);
process.exit(bad ? 1 : 0);
