// Main application entry point
import { downloadBlobsAsZip } from './downloadZip.js';

// Array holding blobs to be exported. Other modules can push to this array.
export const storedBlobs = [];

const rightPanel = document.getElementById('rightPanel');
if (rightPanel) {
  const button = document.createElement('button');
  button.id = 'downloadZipButton';
  button.textContent = 'Download ZIP';
  button.addEventListener('click', () => downloadBlobsAsZip(storedBlobs));
  rightPanel.appendChild(button);
}

console.log('App loaded');
