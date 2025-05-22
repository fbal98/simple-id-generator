// Manages draggable fields over the canvas
const fieldLayer = document.createElement('div');
fieldLayer.id = 'fieldLayer';

let canvas = null;
let canvasRect = null;
let focusedField = null;
const MIN_WIDTH = 20;
const MIN_HEIGHT = 20;

export function initializeFieldManager(canvasElement) {
  canvas = canvasElement;
  const canvasWrapper = document.getElementById('canvasWrapper');
  if (canvasWrapper) {
    canvasWrapper.appendChild(fieldLayer);
    updateFieldLayerPosition();
    window.addEventListener('resize', updateFieldLayerPosition);
    document.addEventListener('click', handleDocumentClick, true); // Use capture to ensure it runs
  } else {
    console.error('Canvas wrapper not found for field layer.');
  }
}

function handleDocumentClick(event) {
    // If the click is outside any field and not on a field control, remove focus.
    let target = event.target;
    let isFieldOrChild = false;
    while (target && target !== document.body) {
        if (target.classList && (target.classList.contains('field') || target.classList.contains('resize-handle'))) {
            isFieldOrChild = true;
            break;
        }
        target = target.parentNode;
    }

    if (!isFieldOrChild && focusedField) {
        setFocusedField(null);
    }
}


function setFocusedField(fieldElement) {
    if (focusedField && focusedField !== fieldElement) {
        focusedField.classList.remove('focused');
    }
    if (fieldElement) {
        fieldElement.classList.add('focused');
    }
    focusedField = fieldElement;
    const event = new CustomEvent('field:focused', {
        detail: fieldElement
            ? {
                  id: fieldElement.id,
                  type: fieldElement.dataset.type
              }
            : null
    });
    fieldLayer.dispatchEvent(event);
}

export function updateFieldLayerPosition() {
    if (!canvas || !fieldLayer.parentElement) return;
    canvasRect = canvas.getBoundingClientRect();
    const wrapperRect = fieldLayer.parentElement.getBoundingClientRect();

    fieldLayer.style.position = 'absolute';
    fieldLayer.style.left = `${canvasRect.left - wrapperRect.left}px`;
    fieldLayer.style.top = `${canvasRect.top - wrapperRect.top}px`;
    fieldLayer.style.width = `${canvasRect.width}px`;
    fieldLayer.style.height = `${canvasRect.height}px`;
    fieldLayer.style.pointerEvents = 'auto'; // Enable pointer events on fieldLayer for click-off
}

let fieldCounter = 0;
const fields = {}; // Store field elements by id

export function addField(type, placeholderText = 'Text Field') {
  if (!canvas) {
    console.error("Canvas not initialized for field manager.");
    alert("Please upload a template image first.");
    return null;
  }
  updateFieldLayerPosition();

  const field = document.createElement('div');
  const id = `field-${type}-${fieldCounter++}`;
  field.className = 'field';
  field.dataset.type = type;
  field.id = id;
  field.textContent = placeholderText;
  
  // Initial position
  field.style.left = '10px';
  const layerHeightForPositioning = fieldLayer.clientHeight > 0 ? fieldLayer.clientHeight : 300;
  field.style.top = `${(Object.keys(fields).length * 25) % Math.max(25, layerHeightForPositioning - 25)}px`; // Stagger new fields

  fieldLayer.appendChild(field); // Add to DOM to measure

  if (type === 'photo') {
    field.style.width = '100px';
    field.style.height = '120px';
    field.textContent = 'Photo Area';
  } else { // Text field: auto-size
    // Default font styles for text fields
    field.style.fontFamily = 'Arial';
    field.style.fontSize = '16px';
    field.style.width = 'auto';
    field.style.height = 'auto';
    // Force reflow if needed, then get dimensions
    // Adding to DOM above should be enough for offsetWidth/Height
    let initialWidth = field.offsetWidth;
    let initialHeight = field.offsetHeight;
    field.style.width = `${Math.max(MIN_WIDTH, initialWidth)}px`;
    field.style.height = `${Math.max(MIN_HEIGHT, initialHeight)}px`;
  }
  
  fields[id] = field;
  setFocusedField(field); // Focus new field

  // Drag handling
  let dragStartX, dragStartY, dragStartLeft, dragStartTop;
  field.addEventListener('pointerdown', e => {
    if (e.target.classList.contains('resize-handle')) return; // Don't drag if resize handle is clicked
    e.stopPropagation();
    setFocusedField(field);

    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragStartLeft = field.offsetLeft;
    dragStartTop = field.offsetTop;

    document.addEventListener('pointermove', onDragPointerMove);
    document.addEventListener('pointerup', onDragPointerUp);
  });

  function onDragPointerMove(e) {
    e.preventDefault();
    let newLeft = dragStartLeft + e.clientX - dragStartX;
    let newTop = dragStartTop + e.clientY - dragStartY;

    // Constrain dragging within fieldLayer
    newLeft = Math.max(0, Math.min(newLeft, fieldLayer.clientWidth - field.offsetWidth));
    newTop = Math.max(0, Math.min(newTop, fieldLayer.clientHeight - field.offsetHeight));
    
    field.style.left = `${newLeft}px`;
    field.style.top = `${newTop}px`;
  }

  function onDragPointerUp() {
    document.removeEventListener('pointermove', onDragPointerMove);
    document.removeEventListener('pointerup', onDragPointerUp);
    dispatchFieldUpdate(field);
  }

  // Resize handle
  const resizeHandle = document.createElement('div');
  resizeHandle.className = 'resize-handle';
  field.appendChild(resizeHandle);

  let resizeStartX, resizeStartY, resizeInitialWidth, resizeInitialHeight, resizeInitialFieldLeft, resizeInitialFieldTop;
  resizeHandle.addEventListener('pointerdown', e => {
    e.stopPropagation(); // Prevent field drag
    setFocusedField(field);

    resizeStartX = e.clientX;
    resizeStartY = e.clientY;
    resizeInitialWidth = field.offsetWidth;
    resizeInitialHeight = field.offsetHeight;
    resizeInitialFieldLeft = field.offsetLeft;
    resizeInitialFieldTop = field.offsetTop;

    document.addEventListener('pointermove', onResizePointerMove);
    document.addEventListener('pointerup', onResizePointerUp);
  });

  function onResizePointerMove(e) {
    e.preventDefault();
    let newWidth = resizeInitialWidth + (e.clientX - resizeStartX);
    let newHeight = resizeInitialHeight + (e.clientY - resizeStartY);

    // Constrain size
    newWidth = Math.max(MIN_WIDTH, newWidth);
    newHeight = Math.max(MIN_HEIGHT, newHeight);

    // Constrain within fieldLayer boundaries
    newWidth = Math.min(newWidth, fieldLayer.clientWidth - resizeInitialFieldLeft);
    newHeight = Math.min(newHeight, fieldLayer.clientHeight - resizeInitialFieldTop);
    
    field.style.width = `${newWidth}px`;
    if (type === 'photo') {
      field.style.height = `${newHeight}px`;
    } else { // Text field: height adjusts to content after width change
      field.style.height = 'auto';
      // Force reflow to get new auto height
      // Reading offsetHeight should trigger reflow if necessary
      let autoHeight = field.offsetHeight;
      field.style.height = `${Math.max(MIN_HEIGHT, autoHeight)}px`;
    }
  }

  function onResizePointerUp() {
    document.removeEventListener('pointermove', onResizePointerMove);
    document.removeEventListener('pointerup', onResizePointerUp);
    // For text fields, ensure height is correctly set after auto adjustment one last time
    if (type !== 'photo') {
        field.style.height = 'auto';
        let finalAutoHeight = field.offsetHeight;
        field.style.height = `${Math.max(MIN_HEIGHT, finalAutoHeight)}px`;
    }
    dispatchFieldUpdate(field);
  }
  
  dispatchFieldUpdate(field); // Dispatch initial state
  return {
    id,
    type,
    x: field.offsetLeft,
    y: field.offsetTop,
    width: field.offsetWidth,
    height: field.offsetHeight,
    text: field.textContent,
    fontFamily: field.style.fontFamily || 'Arial',
    fontSize: parseInt(field.style.fontSize, 10) || 16
  };
}

function dispatchFieldUpdate(fieldElement) {
  const event = new CustomEvent('field:moved', { // Reusing 'field:moved' for simplicity, also for resize/text updates
    detail: {
      id: fieldElement.id,
      type: fieldElement.dataset.type,
      x: fieldElement.offsetLeft,
      y: fieldElement.offsetTop,
      width: fieldElement.offsetWidth,
      height: fieldElement.offsetHeight,
      text: fieldElement.textContent, // Ensure current text is dispatched
      fontFamily: fieldElement.style.fontFamily || 'Arial',
      fontSize: parseInt(fieldElement.style.fontSize, 10) || 16
    }
  });
  fieldLayer.dispatchEvent(event);
  console.log('Field updated:', event.detail);
}


export function clearFields() {
    while (fieldLayer.firstChild) {
        fieldLayer.removeChild(fieldLayer.firstChild);
    }
    for (const id in fields) {
        delete fields[id];
    }
    fieldCounter = 0;
    setFocusedField(null);
}

export function updateFieldOverlayText(fieldId, newText) {
    const fieldElement = fields[fieldId]; // fields is the internal map of fieldId -> DOM element
    if (fieldElement && fieldElement.dataset.type !== 'photo') {
        fieldElement.textContent = newText;
        // Adjust height for auto-sized text fields
        fieldElement.style.height = 'auto';
        // Force reflow to get new auto height
        let autoHeight = fieldElement.offsetHeight;
        fieldElement.style.height = `${Math.max(MIN_HEIGHT, autoHeight)}px`;
        // dispatchFieldUpdate(fieldElement); // Dispatch update so app.js can sync if needed (e.g. fields[id].text)
                                          // This is now implicitly handled as app.js calls this, then if user moves/resizes,
                                          // dispatchFieldUpdate will occur with the new text.
    }
}

export function hideAllFields() {
    for (const id in fields) {
        const field = fields[id];
        if (field) {
            field.style.display = 'none';
        }
    }
}

export function showAllFields() {
    for (const id in fields) {
        const field = fields[id];
        if (field) {
            field.style.display = '';
        }
    }
}


// Expose fieldLayer for app.js to potentially listen to events on it
export { fieldLayer };