// Module to persist field positions in sessionStorage
export function initPositionPersistence() {
  // Attempt to restore saved field positions
  let stored = sessionStorage.getItem('fieldPositions');
  if (stored) {
    try {
      const positions = JSON.parse(stored);
      Object.entries(positions).forEach(([id, pos]) => {
        const el = document.querySelector(`[data-field-id="${id}"]`);
        if (el && pos) {
          if (typeof pos.left !== 'undefined') el.style.left = pos.left;
          if (typeof pos.top !== 'undefined') el.style.top = pos.top;
        }
      });
    } catch (err) {
      console.error('Failed to parse stored field positions', err);
    }
  }

  // Listen for field:moved events to update positions
  window.addEventListener('field:moved', (e) => {
    if (!e || !e.detail) return;
    const { id, left, top } = e.detail;
    if (!id) return;
    let current = {};
    try {
      const raw = sessionStorage.getItem('fieldPositions');
      if (raw) current = JSON.parse(raw);
    } catch (err) {
      console.error('Failed to parse stored field positions', err);
    }
    current[id] = { left, top };
    try {
      sessionStorage.setItem('fieldPositions', JSON.stringify(current));
    } catch (err) {
      console.error('Unable to save field position', err);
    }
  });
}

export default initPositionPersistence;
