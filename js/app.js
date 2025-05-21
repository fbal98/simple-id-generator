// Main application entry point
import { TemplateUploader } from './templateUploader.js';
import * as fieldManager from './fieldManager.js';

TemplateUploader.init();

document.addEventListener('template:loaded', e => {
  console.log('template:loaded', e.detail);
});
// expose manager to console for testing
window.fieldManager = fieldManager;


console.log('App loaded');
