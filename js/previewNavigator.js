export default class PreviewNavigator {
  constructor(engine) {
    this.engine = engine;
    this.previews = [];
    this.index = 0;
    this.injectButtons();
    window.addEventListener('batch:done', (e) => {
      this.previews = Array.isArray(e.detail) ? e.detail : [];
      this.index = 0;
      if (this.previews.length > 0) {
        this.engine.render(this.previews[0]);
      }
    });
  }

  injectButtons() {
    const panel = document.getElementById('rightPanel');
    if (!panel) return;
    this.prevBtn = document.createElement('button');
    this.prevBtn.textContent = 'Prev';
    this.nextBtn = document.createElement('button');
    this.nextBtn.textContent = 'Next';
    panel.appendChild(this.prevBtn);
    panel.appendChild(this.nextBtn);
    this.prevBtn.addEventListener('click', () => this.showPrev());
    this.nextBtn.addEventListener('click', () => this.showNext());
  }

  showPrev() {
    if (!this.previews.length) return;
    this.index = (this.index - 1 + this.previews.length) % this.previews.length;
    this.engine.render(this.previews[this.index]);
  }

  showNext() {
    if (!this.previews.length) return;
    this.index = (this.index + 1) % this.previews.length;
    this.engine.render(this.previews[this.index]);
  }
}
