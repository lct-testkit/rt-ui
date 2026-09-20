// Scenario metadata shared by size.mjs / runtime.py (runtime.py reads scenarios.json written by size.mjs, or this list via `node`).
export const SCENARIOS = [
	{ id: 's0', title: 'S0 Hello-world Svelte', imports: 'ничего', css: [] },
	{ id: 's0r', title: 'S0r Hello-world React', imports: 'ничего (React 19)', css: [] },
	{ id: 's1', title: 'S1 Одна кнопка', imports: 'Button + CSS одной темы', css: ['theme', 'components', 'fonts'] },
	{ id: 's1b', title: 'S1b Одна кнопка через barrel', imports: "import { Button } from 'src/lib/index.ts' (проверка tree-shaking)", css: ['theme', 'components', 'fonts'], extra: true },
	{ id: 's1n', title: 'S1n Кнопка через barrel без sideEffects', imports: 'то же, что S1b, но сборщик игнорирует поле sideEffects пакета (что было бы без него)', css: ['theme', 'components', 'fonts'], extra: true, dir: 's1b', sideEffects: true },
	{ id: 's2', title: 'S2 Форма', imports: 'Input, Select, Checkbox, Switch, Button, Modal', css: ['theme', 'components', 'fonts'] },
	{ id: 's3', title: 'S3 Таблица', imports: 'TableGrid + Pagination + Select', css: ['theme', 'components', 'tablegrid', 'fonts'] },
	{ id: 's4', title: 'S4 Вся библиотека', imports: "import * from 'src/lib/index.ts'", css: ['theme', 'components', 'tablegrid', 'tree', 'side-menu', 'top-menu', 'fonts'] },
	{ id: 's5', title: 'S5 Каркас приложения', imports: 'SideMenu, TopMenu, Tabs, Breadcrumbs', css: ['theme', 'components', 'side-menu', 'top-menu', 'fonts'] }
];
// runtime-only harness page (mount cost / popup leaks); built like a scenario but excluded from the size tables
export const RUNTIME_ONLY = [{ id: 'mount', title: 'Runtime harness (mount cost, leaks)' }];
