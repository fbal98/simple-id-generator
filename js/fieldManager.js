// Manages draggable fields over the canvas
const fieldLayer = document.createElement('div');
fieldLayer.id = 'fieldLayer';
// Styles for fieldLayer are now primarily in CSS for better separation.
// It will be positioned relative to the canvas.

let canvas = null; // Will be set by app.js
let canvasRect = null;

export function initializeFieldManager(canvasElement) {
  canvas = canvasElement;
  const canvasWrapper = document.getElementById('canvasWrapper'); // Or pass canvasWrapper as well
  if (canvasWrapper) {
    canvasWrapper.appendChild(fieldLayer);
    // Adjust fieldLayer to be on top of the canvas, matching its position and size
    // This might need dynamic adjustment if canvas resizes or moves.
    // For now, assuming canvas position is static within canvasWrapper.
    updateFieldLayerPosition();
  } else {
    console.error('Canvas wrapper not found for field layer.');
  }
}

export function updateFieldLayerPosition() {
    if (!canvas || !fieldLayer.parentElement) return;
    // Position fieldLayer directly over the canvas
    // The canvas itself is centered in canvasWrapper by flexbox.
    // fieldLayer is a child of canvasWrapper.
    // We need to offset fieldLayer to align with the canvas.
    canvasRect = canvas.getBoundingClientRect();
    const wrapperRect = fieldLayer.parentElement.getBoundingClientRect();

    fieldLayer.style.position = 'absolute';
    fieldLayer.style.left = `${canvasRect.left - wrapperRect.left}px`;
    fieldLayer.style.top = `${canvasRect.top - wrapperRect.top}px`;
    fieldLayer.style.width = `${canvasRect.width}px`;
    fieldLayer.style.height = `${canvasRect.height}px`;
}


let fieldCounter = 0;
const fields = {}; // Store field elements by id

export function addField(type, placeholderText = 'Text Field') {
  if (!canvas) {
    console.error("Canvas not initialized for field manager.");
    alert("Please upload a template image first.");
    return null;
  }
  updateFieldLayerPosition(); // Ensure layer is correctly positioned before adding field

  const field = document.createElement('div');
  const id = `field-${type}-${fieldCounter++}`;
  field.className = 'field';
  field.dataset.type = type;
  field.id = id;
  field.textContent = placeholderText;

  // Default size for photo field
  if (type === 'photo') {
    field.style.width = '100px'; // Default width for photo
    field.style.height = '120px'; // Default height for photo
    field.textContent = 'Photo Area'; // Override placeholder for photo
  } else {
    field.style.width = '150px'; // Default width for text fields
    field.style.height = '20px';  // Default height for text fields
  }
  
  // Initial position relative to fieldLayer (which is aligned with canvas)
  field.style.left = '10px';
  
  // Use clientHeight for live dimension, fallback to a default if height is 0 to avoid NaN from modulo by zero.
  const layerHeightForPositioning = fieldLayer.clientHeight;
  const effectiveLayerHeight = layerHeightForPositioning > 0 ? layerHeightForPositioning : 300; // Default to 300px if actual height is 0
  field.style.top = `${(fieldCounter * 30) % effectiveLayerHeight}px`; // Stagger new fields

  fieldLayer.appendChild(field);
  fields[id] = field;

  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;

  function onPointerMove(e) {
    e.preventDefault(); // Prevent text selection during drag
    let newLeft = startLeft + e.clientX - startX;
    let newTop = startTop + e.clientY - startY;

    // Constrain dragging within the fieldLayer (canvas bounds)
    const fieldRect = field.getBoundingClientRect(); // Current field rect
    const layerRect = fieldLayer.getBoundingClientRect(); // fieldLayer rect

    // Calculate relative positions based on parent's offset for style.left/top
    const parentRect = fieldLayer.offsetParent.getBoundingClientRect();

    newLeft = Math.max(0, newLeft);
    newTop = Math.max(0, newTop);
    
    // field.offsetWidth and field.offsetHeight can be used here
    // but for simplicity, we'll use the style.width/height if available or estimate
    const fieldWidth = parseInt(field.style.width);
    const fieldHeight = parseInt(field.style.height);

    if (newLeft + fieldWidth > parseInt(fieldLayer.style.width)) {
        newLeft = parseInt(fieldLayer.style.width) - fieldWidth;
    }
    if (newTop + fieldHeight > parseInt(fieldLayer.style.height)) {
        newTop = parseInt(fieldLayer.style.height) - fieldHeight;
    }
    
    field.style.left = `${newLeft}px`;
    field.style.top = `${newTop}px`;
  }

  function endDrag(e) {
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', endDrag);
    
    const finalLeft = field.offsetLeft;
    const finalTop = field.offsetTop;
    const finalWidth = parseInt(field.style.width);
    const finalHeight = parseInt(field.style.height);

    const event = new CustomEvent('field:moved', {
      detail: {
        id,
        type: field.dataset.type,
        x: finalLeft,
        y: finalTop,
        width: finalWidth,
        height: finalHeight,
        text: field.textContent // Or specific data for the field
      }
    });
    // Dispatch from canvas or a common parent if needed elsewhere, or field itself
    fieldLayer.dispatchEvent(event);
    console.log('Field moved:', event.detail);
  }

  field.addEventListener('pointerdown', e => {
    e.stopPropagation(); // Prevent triggering other listeners if any
    startX = e.clientX;
    startY = e.clientY;
    startLeft = field.offsetLeft;
    startTop = field.offsetTop;
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', endDrag);
  });

  return { id, type, x: parseInt(field.style.left), y: parseInt(field.style.top), width: parseInt(field.style.width), height: parseInt(field.style.height), text: field.textContent };
}

export function getFieldPositions() {
  const positions = {};
  for (const id in fields) {
    const field = fields[id];
    positions[id] = {
      id: field.id,
      type: field.dataset.type,
      x: field.offsetLeft,
      y: field.offsetTop,
      width: parseInt(field.style.width),
      height: parseInt(field.style.height),
      text: field.textContent // Placeholder text or future actual text
    };
  }
  return positions;
}

export function clearFields() {
    while (fieldLayer.firstChild) {
        fieldLayer.removeChild(fieldLayer.firstChild);
    }
    for (const id in fields) {
        delete fields[id];
    }
    fieldCounter = 0;
}

// Expose fieldLayer for app.js to potentially listen to events on it
export { fieldLayer };