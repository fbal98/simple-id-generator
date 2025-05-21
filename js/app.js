import CanvasEngine from './canvasEngine.js';
import PreviewNavigator from './previewNavigator.js';

const engine = new CanvasEngine();
new PreviewNavigator(engine);

console.log('App loaded');
