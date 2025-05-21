import PositionPersistence from './PositionPersistence.js';
import FieldManager from './FieldManager.js';
import initStyleControls from './styleControls.js';

document.addEventListener('DOMContentLoaded', () => {
    const persistence = new PositionPersistence();
    const fieldManager = new FieldManager(persistence);
    fieldManager.init();
    initStyleControls(fieldManager);

    console.log('App loaded');
});
