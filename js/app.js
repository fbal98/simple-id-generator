// Main application entry point
import initPositionPersistence from './positionPersistence.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log('App loaded');
  initPositionPersistence();
});
