export default class CanvasEngine {
  constructor(wrapper = document.getElementById('canvasWrapper')) {
    this.wrapper = wrapper;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    if (this.wrapper) {
      this.wrapper.appendChild(this.canvas);
    }
  }

  render(src) {
    if (!src) return;
    const width = src.width || src.videoWidth || src.naturalWidth || 0;
    const height = src.height || src.videoHeight || src.naturalHeight || 0;
    if (width && height) {
      this.canvas.width = width;
      this.canvas.height = height;
      this.ctx.clearRect(0, 0, width, height);
      this.ctx.drawImage(src, 0, 0, width, height);
    }
  }
}
