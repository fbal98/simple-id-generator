// Manages draggable fields over the canvas
const fieldLayer = document.createElement('div');
fieldLayer.id = 'fieldLayer';
fieldLayer.style.position = 'absolute';
fieldLayer.style.top = '0';
fieldLayer.style.left = '0';
fieldLayer.style.right = '0';
fieldLayer.style.bottom = '0';

const canvasWrapper = document.getElementById('canvasWrapper');
if (canvasWrapper) {
  canvasWrapper.style.position = 'relative';
  canvasWrapper.appendChild(fieldLayer);
}

let counter = 0;

export function addField(type) {
  const field = document.createElement('div');
  const id = `field-${counter++}`;
  field.className = 'field';
  field.dataset.type = type;
  field.id = id;
  field.style.left = '0px';
  field.style.top = '0px';
  fieldLayer.appendChild(field);

  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;

  function onPointerMove(e) {
    field.style.left = `${startLeft + e.clientX - startX}px`;
    field.style.top = `${startTop + e.clientY - startY}px`;
  }

  function endDrag(e) {
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', endDrag);
    const event = new CustomEvent('field:moved', {
      detail: { id, x: field.offsetLeft, y: field.offsetTop }
    });
    field.dispatchEvent(event);
  }

  field.addEventListener('pointerdown', e => {
    startX = e.clientX;
    startY = e.clientY;
    startLeft = field.offsetLeft;
    startTop = field.offsetTop;
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', endDrag);
  });

  return id;
}

export { fieldLayer };

