export default class ProgressIndicator {
  constructor() {
    this.rightPanel = document.getElementById('rightPanel');
    this.createElements();
    this.registerEvents();
  }

  createElements() {
    this.container = document.createElement('div');
    this.container.id = 'progressContainer';

    this.bar = document.createElement('div');
    this.bar.id = 'progressBar';

    this.label = document.createElement('span');
    this.label.id = 'progressLabel';
    this.bar.appendChild(this.label);

    this.container.appendChild(this.bar);
    this.reset();

    if (this.rightPanel) {
      this.rightPanel.appendChild(this.container);
    }
  }

  registerEvents() {
    document.addEventListener('batch:progress', (e) => {
      this.updateProgress(e.detail);
    });

    document.addEventListener('zip:progress', (e) => {
      this.updateProgress(e.detail);
    });

    document.addEventListener('batch:complete', () => this.reset());
    document.addEventListener('zip:complete', () => this.reset());
  }

  updateProgress(percent) {
    if (typeof percent !== 'number') {
      return;
    }
    const clamped = Math.min(100, Math.max(0, percent));
    this.bar.style.width = `${clamped}%`;
    this.label.textContent = `${Math.round(clamped)}%`;

    if (clamped >= 100) {
      setTimeout(() => this.reset(), 500);
    }
  }

  reset() {
    this.bar.style.width = '0%';
    this.label.textContent = '';
  }
}
