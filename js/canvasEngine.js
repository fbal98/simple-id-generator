// Canvas engine module
const canvasWrapper = document.getElementById('canvasWrapper');

const canvas = document.createElement('canvas');
canvasWrapper.appendChild(canvas);

const ctx = canvas.getContext('2d');

// Set initial canvas height to 80vh
function setInitialSize() {
  const height = window.innerHeight * 0.8;
  canvas.height = height;
  // Default width equals height until an image provides aspect ratio
  canvas.width = height;
}

setInitialSize();

function drawImageToCanvas(img) {
  // Adjust canvas width according to the image aspect ratio
  canvas.width = canvas.height * (img.width / img.height);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
}

// Listen for template image load events
// Event detail should contain the loaded HTMLImageElement
window.addEventListener('template:loaded', (e) => {
  const img = e.detail;
  if (img instanceof HTMLImageElement) {
    drawImageToCanvas(img);
  }
});

export {};
