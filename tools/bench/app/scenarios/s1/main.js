import '@rt-ui/styles/themes/rtk_default_light.css';
import '@rt-ui/styles/base.css';
import '@rt-ui/styles/components.css';
import '@rt-ui/styles/fonts.css';
import { mount, tick } from 'svelte';
import Button from '@rt-ui/components/Button/Button/Button.svelte';

performance.mark('bench-start');
mount(Button, { target: document.getElementById('app'), props: { label: 'Сохранить' } });
tick().then(() => performance.mark('bench-ready'));
