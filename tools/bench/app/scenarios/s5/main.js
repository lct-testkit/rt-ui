import '@rt-ui/styles/themes/rtk_default_light.css';
import '@rt-ui/styles/base.css';
import '@rt-ui/styles/components.css';
import '@rt-ui/styles/side-menu.css';
import '@rt-ui/styles/top-menu.css';
import '@rt-ui/styles/fonts.css';
import { mount, tick } from 'svelte';
import App from './App.svelte';

performance.mark('bench-start');
mount(App, { target: document.getElementById('app') });
tick().then(() => performance.mark('bench-ready'));
