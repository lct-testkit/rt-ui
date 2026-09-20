import { createElement } from 'react';
import { createRoot } from 'react-dom/client';

performance.mark('bench-start');
createRoot(document.getElementById('app')).render(createElement('h1', null, 'Hello, world'));
// React 19 renders the root in a scheduler task; wait for the DOM
const done = () => (document.querySelector('#app h1') ? performance.mark('bench-ready') : setTimeout(done, 0));
done();
