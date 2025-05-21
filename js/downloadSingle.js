// Module that manages single ID downloads and blob storage

const canvasBlobMap = new Map();
let currentPreviewIndex = 0;
let nextIndex = 0;
const MAX_STORED_BLOBS = 200;

function enforceLimit() {
  while (canvasBlobMap.size > MAX_STORED_BLOBS) {
    const firstKey = canvasBlobMap.keys().next().value;
    canvasBlobMap.delete(firstKey);
  }
}

// Listen for preview index changes from other parts of the app
// Expected event shape: { detail: { index: Number } }
document.addEventListener('preview:change', (e) => {
  if (e && e.detail && typeof e.detail.index === 'number') {
    currentPreviewIndex = e.detail.index;
  }
});

// On batch completion, convert canvases to blobs and store them
// Expected event shape: { detail: { canvases: HTMLCanvasElement[] } }
document.addEventListener('batch:done', (e) => {
  const canvases = e && e.detail && Array.isArray(e.detail.canvases)
    ? e.detail.canvases
    : [];

  canvases.forEach((canvas) => {
    const idx = nextIndex++;
    if (canvas && typeof canvas.toBlob === 'function') {
      canvas.toBlob((blob) => {
        if (blob) {
          canvasBlobMap.set(idx, blob);
          enforceLimit();
        }
      }, 'image/png');
    }
  });
});

// Save button setup
const rightPanel = document.getElementById('rightPanel');
if (rightPanel) {
  const btn = document.createElement('button');
  btn.textContent = 'Save current ID';
  rightPanel.appendChild(btn);

  btn.addEventListener('click', () => {
    const blob = canvasBlobMap.get(currentPreviewIndex);
    if (!blob) {
      console.warn('No ID image available for index', currentPreviewIndex);
      return;
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `FakeID_${currentPreviewIndex}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });
}

export { canvasBlobMap, currentPreviewIndex };
