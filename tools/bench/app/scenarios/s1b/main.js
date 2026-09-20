// tree-shaking probe: the same single Button as S1, but imported through the generated barrel (src/lib/index.ts, ~120 exports)
import '@rt-ui/styles/themes/rtk_default_light.css';
import '@rt-ui/styles/base.css';
import '@rt-ui/styles/components.css';
import '@rt-ui/styles/fonts.css';
import { mount, tick } from 'svelte';
import { Button } from '@rt-ui/index.ts';

performance.mark('bench-start');
mount(Button, { target: document.getElementById('app'), props: { label: 'Сохранить' } });
tick().then(() => performance.mark('bench-ready'));
