// Main application entry point
import { TemplateUploader } from './templateUploader.js';

TemplateUploader.init();

document.addEventListener('template:loaded', e => {
  console.log('template:loaded', e.detail);
});

console.log("App loaded");
