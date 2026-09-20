// SSR smoke test of the components that carry the author's `motion` extension (src/lib/ext): each one is rendered on the SERVER with `svelte/server`, with no
// provider (= the original) and inside an `<ExtMotionProvider>` in mode 'svelte' with a Tween and with a Spring. A crash (ReferenceError: window / document is
// not defined, ...) would break every SSR consumer of the package that switches the motion on.
//
//   node tools/check-ext-ssr.mjs
//
// Needs no running server (a Vite server in middleware mode compiles the sources). The playground itself is `ssr = false`, so the browser checks
// (`ext-check.py`) never exercise the server path: this is its counterpart. Exit code 0 = every render passed.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tmp = path.join(root, 'tools', '.tmp-ext-ssr');
fs.rmSync(tmp, { recursive: true, force: true });
fs.mkdirSync(tmp, { recursive: true });

const abs = (p) => path.join(root, 'src/lib', p).split(path.sep).join('/');
const imp = (name, file) => `import ${name} from '${abs(file)}';`;

// what is rendered (svelte sources of small wrapper components)
const CASES = {
	calendar: `<script>${imp('PickerDate', 'components/PickerDate/PickerDate.svelte')} ${imp('InputDate', 'components/InputDate/InputDate.svelte')}</script>
<PickerDate activeDate={new Date(2026, 8, 15)} isRange secondDate={new Date(2026, 8, 20)} /><PickerDate calendarMode="YEARS_WITH_MONTH" /><InputDate label="d" />`,
	accordion: `<script>${imp('Accordion', 'components/Accordion/Accordion/Accordion.svelte')} ${imp('AccordionSummary', 'components/Accordion/AccordionSummary/AccordionSummary.svelte')} ${imp('AccordionDetails', 'components/Accordion/AccordionDetails/AccordionDetails.svelte')}</script>
<Accordion isOpen><AccordionSummary>{#snippet children()}Head{/snippet}</AccordionSummary><AccordionDetails>Body</AccordionDetails></Accordion><Accordion motion="spring"><AccordionSummary>{#snippet children()}Head{/snippet}</AccordionSummary><AccordionDetails>Body</AccordionDetails></Accordion>`,
	tabs: `<script>${imp('TabsGroup', 'components/Tabs/TabsGroup/TabsGroup.svelte')} ${imp('TabsItem', 'components/Tabs/TabsItem/TabsItem.svelte')} ${imp('TabsPanel', 'components/Tabs/TabsPanel/TabsPanel.svelte')}</script>
<TabsGroup value="0"><TabsItem index="0" label="A" /><TabsItem index="1" label="B" /></TabsGroup><TabsPanel value="0" index="0">panel</TabsPanel>`,
	sidemenu: `<script>${['SideMenu', 'SideMenuContent', 'SideMenuItem', 'SideMenuExpandContent', 'SideMenuCollapse', 'SideMenuCollapseTrigger', 'SideMenuCollapseContent'].map((n) => imp(n, `components/SideMenu/${n}.svelte`)).join(' ')}</script>
<SideMenu isOpened><SideMenuContent><SideMenuItem>One</SideMenuItem><SideMenuCollapse><SideMenuCollapseTrigger>Group</SideMenuCollapseTrigger><SideMenuCollapseContent><SideMenuItem>In</SideMenuItem></SideMenuCollapseContent></SideMenuCollapse><SideMenuExpandContent isOpened><SideMenuItem>Extra</SideMenuItem></SideMenuExpandContent></SideMenuContent></SideMenu><SideMenu isOpened={false}><SideMenuContent><SideMenuItem>One</SideMenuItem></SideMenuContent></SideMenu>`,
	overlays: `<script>${imp('Popover', 'components/Popover/Popover.svelte')} ${imp('Tooltip', 'components/Tooltip/Tooltip.svelte')} ${imp('Modal', 'components/Modal/Modal.svelte')} ${imp('Drawer', 'components/Drawer/Drawer.svelte')}</script>
<Popover title="t" body="b" isOpened>x</Popover><Tooltip title="t" isOpened>y</Tooltip><Modal isOpened fullHeight>m</Modal><Drawer isOpened fullHeight position="left">d</Drawer>`,
	misc: `<script>${imp('Slider', 'components/Slider/Slider.svelte')} ${imp('Wizard', 'components/Wizard/WizardStepsHorizontal/WizardStepsHorizontal.svelte')} ${imp('Progress', 'ext/Progress/Progress.svelte')}</script>
<Slider value={[30]} /><Wizard currentStep={1} steps={[{ title: 'a' }, { title: 'b' }]} /><Progress value={40} showValue />`
};
const MODES = [
	['off', 'tween'],
	['svelte', 'tween'],
	['svelte', 'spring']
];
for (const [k, v] of Object.entries(CASES)) {
	fs.writeFileSync(path.join(tmp, `${k}.svelte`), v);
	for (const [mode, type] of MODES) {
		fs.writeFileSync(path.join(tmp, `${k}.${mode}.${type}.svelte`), `<script>import P from '${abs('ext/ExtMotionProvider.svelte')}'; import Inner from './${k}.svelte';</script><P mode="${mode}" type="${type}"><Inner /></P>`);
	}
}

const server = await createServer({
	root,
	configFile: false,
	logLevel: 'error',
	server: { middlewareMode: true, hmr: false, watch: null },
	appType: 'custom',
	plugins: [svelte({ configFile: false, compilerOptions: { runes: ({ filename }) => (filename.replace(/\\/g, '/').split('/').includes('node_modules') ? undefined : true) } })],
	resolve: { dedupe: ['svelte'] },
	optimizeDeps: { noDiscovery: true, include: [] },
	// one Svelte instance for the components and for `render` (a second copy would not see the component context)
	ssr: { noExternal: ['svelte'] }
});
let bad = 0;
let total = 0;
try {
	const { render } = await server.ssrLoadModule('svelte/server');
	for (const k of Object.keys(CASES)) {
		for (const [mode, type] of MODES) {
			total++;
			const id = path.join(tmp, `${k}.${mode}.${type}.svelte`).split(path.sep).join('/');
			try {
				const mod = await server.ssrLoadModule(id);
				const out = render(mod.default, { props: {} });
				console.log(`PASS  SSR ${k} [${mode}/${type}]: ${(out.body ?? String(out)).length} bytes of HTML`);
			} catch (e) {
				bad++;
				console.log(`FAIL  SSR ${k} [${mode}/${type}]: ${String(e && e.stack ? e.stack : e).split('\n').slice(0, 3).join(' | ')}`);
			}
		}
	}
} finally {
	await server.close();
	fs.rmSync(tmp, { recursive: true, force: true });
}
console.log(`\n${total - bad}/${total} server renders passed`);
process.exit(bad ? 1 : 0);
