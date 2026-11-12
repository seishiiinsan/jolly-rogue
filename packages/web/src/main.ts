import { startApp } from './app.js';

const root = document.querySelector<HTMLElement>('#app');
if (!root) throw new Error('élément #app introuvable');
startApp(root);
