// Field Manager module for Simple ID Generator
// Handles draggable/resizable field overlays with clean event-driven architecture

import { CONFIG, getEventName, getCSSClass } from './config.js';

export class FieldManager extends EventTarget {
  constructor() {
    super();
    
    // Private properties (using underscore convention for private)
    this._canvas = null;
    this._canvasRect = null;
    this._fieldLayer = null;
    this._fields = new Map();
    this._focusedField = null;
    this._fieldCounter = 0;
    this._isInitialized = false;
    
    // Bind methods to preserve context
    this._handleDocumentClick = this._handleDocumentClick.bind(this);
    this._updateFieldLayerPosition = this._updateFieldLayerPosition.bind(this);
  }

  /**
   * Initialize the field manager with a canvas element
   * @param {HTMLCanvasElement} canvasElement - Canvas to overlay fields on
   */
  initialize(canvasElement) {
    if (this._isInitialized) {
      console.warn('FieldManager already initialized');
      return;
    }

    this._canvas = canvasElement;
    const canvasWrapper = document.getElementById(CONFIG.UI.ELEMENTS.CANVAS_WRAPPER);
    
    if (!canvasWrapper) {
      throw new Error('Canvas wrapper not found for field layer');
    }

    // Create and set up field layer
    this._fieldLayer = document.createElement('div');
    this._fieldLayer.id = CONFIG.UI.ELEMENTS.FIELD_LAYER;
    this._fieldLayer.className = getCSSClass('FIELD_LAYER') || 'field-layer';
    
    canvasWrapper.appendChild(this._fieldLayer);
    this._updateFieldLayerPosition();
    
    // Set up event listeners
    window.addEventListener('resize', this._updateFieldLayerPosition);
    document.addEventListener('click', this._handleDocumentClick, true);
    
    this._isInitialized = true;
    this._emitEvent(getEventName('STATE_CHANGED'), { initialized: true });
  }

  /**
   * Add a new field to the overlay
   * @param {string} type - Field type from CONFIG.FIELDS.TYPES
   * @param {Object} options - Field options
   * @returns {Object} Field configuration
   */
  addField(type, options = {}) {
    if (!this._isInitialized) {
      throw new Error('FieldManager not initialized');
    }

    const {
      text = this._getDefaultText(type),
      x = CONFIG.FIELDS.POSITION_LEFT,
      y = this._calculateDefaultPosition(),
      fontFamily = CONFIG.FIELDS.DEFAULT_FONT_FAMILY,
      fontSize = CONFIG.FIELDS.DEFAULT_FONT_SIZE
    } = options;

    const fieldId = `field-${type}-${this._fieldCounter++}`;
    const fieldElement = this._createFieldElement(fieldId, type, text, fontFamily, fontSize);
    
    // Position the field
    fieldElement.style.left = `${x}px`;
    fieldElement.style.top = `${y}px`;
    
    this._fieldLayer.appendChild(fieldElement);
    
    // Configure field dimensions based on type
    this._configureFieldDimensions(fieldElement, type);
    
    // Store field reference
    this._fields.set(fieldId, fieldElement);
    
    // Set up field interactions
    this._setupFieldInteractions(fieldElement);
    
    // Get final field configuration
    const fieldConfig = this._getFieldConfiguration(fieldElement);
    
    // Emit field added event BEFORE focusing to ensure app state is updated
    this._emitFieldEvent(getEventName('FIELD_ADDED'), fieldConfig);
    
    // Focus the new field after it's been added to app state
    setTimeout(() => {
      this.setFocusedField(fieldElement);
    }, 0);
    
    return fieldConfig;
  }

  /**
   * Remove a field from the overlay
   * @param {string} fieldId - Field ID to remove
   * @returns {boolean} Success status
   */
  removeField(fieldId) {
    const fieldElement = this._fields.get(fieldId);
    if (!fieldElement) {
      return false;
    }

    // Clear focus if this field was focused
    if (this._focusedField === fieldElement) {
      this.setFocusedField(null);
    }

    // Remove from DOM and internal storage
    fieldElement.remove();
    this._fields.delete(fieldId);
    
    // Emit field removed event
    this._emitFieldEvent(getEventName('FIELD_REMOVED'), { fieldId });
    
    return true;
  }

  /**
   * Update field text content
   * @param {string} fieldId - Field ID
   * @param {string} newText - New text content
   */
  updateFieldText(fieldId, newText) {
    const fieldElement = this._fields.get(fieldId);
    if (!fieldElement) {
      return;
    }

    const type = fieldElement.dataset.type;
    
    if (type === CONFIG.FIELDS.TYPES.PHOTO) {
      // Photo fields should maintain their placeholder text
      // Only clear text when actually displaying a photo
      if (!fieldElement.classList.contains('has-photo')) {
        const textNode = Array.from(fieldElement.childNodes)
          .find(node => node.nodeType === Node.TEXT_NODE);
        if (textNode) {
          textNode.textContent = 'Photo Area';
        } else {
          const newTextNode = document.createTextNode('Photo Area');
          fieldElement.insertBefore(newTextNode, fieldElement.firstChild);
        }
      }
    } else {
      this._updateTextFieldContent(fieldElement, newText);
    }
  }

  /**
   * Set focused field
   * @param {HTMLElement|null} fieldElement - Field to focus or null to clear
   */
  setFocusedField(fieldElement) {
    // Remove focus from previous field
    if (this._focusedField && this._focusedField !== fieldElement) {
      this._focusedField.classList.remove(getCSSClass('FIELD_FOCUSED'));
    }

    // Set new focused field
    if (fieldElement) {
      fieldElement.classList.add(getCSSClass('FIELD_FOCUSED'));
    }

    this._focusedField = fieldElement;
    
    // Emit focus event
    const detail = fieldElement ? {
      fieldId: fieldElement.id,
      type: fieldElement.dataset.type
    } : null;
    
    this._emitEvent(getEventName('FIELD_FOCUSED'), detail);
  }

  /**
   * Get all field positions and configurations
   * @returns {Object} Field configurations by ID
   */
  getFieldConfigurations() {
    const configurations = {};
    
    for (const [fieldId, fieldElement] of this._fields) {
      configurations[fieldId] = this._getFieldConfiguration(fieldElement);
    }
    
    return configurations;
  }

  /**
   * Clear all fields
   */
  clearFields() {
    const fieldCount = this._fields.size;
    
    // Remove all field elements
    for (const fieldElement of this._fields.values()) {
      fieldElement.remove();
    }
    
    // Clear internal state
    this._fields.clear();
    this._focusedField = null;
    this._fieldCounter = 0;
    
    if (fieldCount > 0) {
      this._emitEvent(getEventName('FIELD_REMOVED'), { 
        cleared: true, 
        count: fieldCount 
      });
    }
  }

  /**
   * Hide all fields
   */
  hideAllFields() {
    for (const fieldElement of this._fields.values()) {
      fieldElement.style.display = 'none';
    }
  }

  /**
   * Show all fields
   */
  showAllFields() {
    for (const fieldElement of this._fields.values()) {
      fieldElement.style.display = '';
    }
  }

  /**
   * Enter generated mode - add styling for generation preview
   */
  enterGeneratedMode() {
    for (const fieldElement of this._fields.values()) {
      fieldElement.classList.add('generated-mode');
    }
  }

  /**
   * Exit generated mode - remove generation styling
   */
  exitGeneratedMode() {
    for (const fieldElement of this._fields.values()) {
      fieldElement.classList.remove('generated-mode');
      // Reset photo fields to show placeholder text
      if (fieldElement.dataset.type === CONFIG.FIELDS.TYPES.PHOTO) {
        fieldElement.classList.remove('has-photo');
        const textNode = Array.from(fieldElement.childNodes)
          .find(node => node.nodeType === Node.TEXT_NODE);
        if (textNode) {
          textNode.textContent = 'Photo Area';
        }
      }
    }
  }

  /**
   * Get field count
   * @returns {number} Number of fields
   */
  get fieldCount() {
    return this._fields.size;
  }

  /**
   * Get focused field ID
   * @returns {string|null} Focused field ID
   */
  get focusedFieldId() {
    return this._focusedField ? this._focusedField.id : null;
  }

  /**
   * Get field layer element (for testing/debugging)
   * @returns {HTMLElement|null} Field layer element
   */
  get fieldLayerElement() {
    return this._fieldLayer;
  }

  /**
   * Update field layer position (called on window resize)
   */
  updatePosition() {
    this._updateFieldLayerPosition();
  }

  /**
   * Clean up event listeners and resources
   */
  destroy() {
    if (!this._isInitialized) {
      return;
    }

    // Remove event listeners
    window.removeEventListener('resize', this._updateFieldLayerPosition);
    document.removeEventListener('click', this._handleDocumentClick, true);
    
    // Clear fields and DOM
    this.clearFields();
    if (this._fieldLayer && this._fieldLayer.parentNode) {
      this._fieldLayer.parentNode.removeChild(this._fieldLayer);
    }
    
    // Reset state
    this._canvas = null;
    this._fieldLayer = null;
    this._isInitialized = false;
    
    this._emitEvent(getEventName('STATE_CHANGED'), { destroyed: true });
  }

  // Private methods

  _updateFieldLayerPosition() {
    if (!this._canvas || !this._fieldLayer || !this._fieldLayer.parentElement) {
      return;
    }

    this._canvasRect = this._canvas.getBoundingClientRect();
    const wrapperRect = this._fieldLayer.parentElement.getBoundingClientRect();

    this._fieldLayer.style.position = 'absolute';
    this._fieldLayer.style.left = `${this._canvasRect.left - wrapperRect.left}px`;
    this._fieldLayer.style.top = `${this._canvasRect.top - wrapperRect.top}px`;
    this._fieldLayer.style.width = `${this._canvasRect.width}px`;
    this._fieldLayer.style.height = `${this._canvasRect.height}px`;
    this._fieldLayer.style.pointerEvents = 'auto';
  }

  _handleDocumentClick(event) {
    // Check if click is outside any field
    let target = event.target;
    let isFieldOrChild = false;
    
    while (target && target !== document.body) {
      if (target.classList && (
        target.classList.contains(getCSSClass('FIELD')) ||
        target.classList.contains(getCSSClass('RESIZE_HANDLE'))
      )) {
        isFieldOrChild = true;
        break;
      }
      target = target.parentNode;
    }

    if (!isFieldOrChild && this._focusedField) {
      this.setFocusedField(null);
    }
  }

  _createFieldElement(fieldId, type, text, fontFamily, fontSize) {
    const field = document.createElement('div');
    field.className = getCSSClass('FIELD');
    field.dataset.type = type;
    field.id = fieldId;
    field.dataset.labelEdge = 'left';
    
    // Create text node
    const textNode = document.createTextNode(text);
    field.appendChild(textNode);
    
    return field;
  }

  _configureFieldDimensions(fieldElement, type) {
    if (type === CONFIG.FIELDS.TYPES.PHOTO) {
      // Photo field configuration
      fieldElement.style.width = `${CONFIG.FIELDS.DEFAULT_WIDTH}px`;
      fieldElement.style.height = `${CONFIG.FIELDS.DEFAULT_HEIGHT}px`;
      
      const textNode = Array.from(fieldElement.childNodes)
        .find(node => node.nodeType === Node.TEXT_NODE);
      if (textNode) {
        textNode.textContent = 'Photo Area';
      }
    } else {
      // Text field configuration
      fieldElement.style.fontFamily = CONFIG.FIELDS.DEFAULT_FONT_FAMILY;
      fieldElement.style.fontSize = `${CONFIG.FIELDS.DEFAULT_FONT_SIZE}px`;
      fieldElement.style.padding = CONFIG.FIELDS.TEXT_PADDING;
      fieldElement.style.whiteSpace = 'nowrap';
      fieldElement.style.overflow = 'hidden';
      fieldElement.style.textOverflow = 'ellipsis';
      
      // Auto-size based on content with proper measurement
      const measuredSize = this._measureTextContent(
        fieldElement.textContent, 
        fieldElement.style.fontFamily,
        fieldElement.style.fontSize
      );
      
      // Use consistent padding that matches canvas rendering (2px each side)
      const horizontalPadding = 4; // 2px padding on each side = 4px total
      fieldElement.style.width = `${Math.max(CONFIG.FIELDS.MIN_WIDTH, measuredSize.width + horizontalPadding)}px`;
      fieldElement.style.height = `${Math.max(CONFIG.FIELDS.MIN_HEIGHT, measuredSize.height)}px`;
      
      // Add edge elements for label edge selection
      this._addEdgeElements(fieldElement);
    }
  }

  _addEdgeElements(fieldElement) {
    const leftEdge = document.createElement('div');
    leftEdge.className = 'field-edge edge-left';
    fieldElement.appendChild(leftEdge);
    
    const rightEdge = document.createElement('div');
    rightEdge.className = 'field-edge edge-right';
    fieldElement.appendChild(rightEdge);
    
    const topEdge = document.createElement('div');
    topEdge.className = 'field-edge edge-top';
    fieldElement.appendChild(topEdge);
    
    const bottomEdge = document.createElement('div');
    bottomEdge.className = 'field-edge edge-bottom';
    fieldElement.appendChild(bottomEdge);
    
    // Set up edge click handlers
    const edges = ['left', 'right', 'top', 'bottom'];
    const edgeElements = { left: leftEdge, right: rightEdge, top: topEdge, bottom: bottomEdge };
    
    edges.forEach(edge => {
      edgeElements[edge].addEventListener('click', (e) => {
        e.stopPropagation();
        fieldElement.dataset.labelEdge = edge;
        
        // Remove all label edge classes
        edges.forEach(e => fieldElement.classList.remove(`label-edge-${e}`));
        
        // Add the current edge class
        fieldElement.classList.add(`label-edge-${edge}`);
        
        this._dispatchFieldUpdate(fieldElement);
      });
    });
    
    // Set default label edge
    const defaultEdge = fieldElement.dataset.labelEdge || 'left';
    fieldElement.classList.add(`label-edge-${defaultEdge}`);
  }

  _setupFieldInteractions(fieldElement) {
    // Add resize handle
    const resizeHandle = document.createElement('div');
    resizeHandle.className = getCSSClass('RESIZE_HANDLE');
    fieldElement.appendChild(resizeHandle);
    
    // Set up drag and resize handlers
    this._setupDragHandler(fieldElement);
    this._setupResizeHandler(fieldElement, resizeHandle);
    
    // Focus on click
    fieldElement.addEventListener('click', (e) => {
      e.stopPropagation();
      this.setFocusedField(fieldElement);
    });
  }

  _setupDragHandler(fieldElement) {
    let dragState = null;
    
    const onDragMove = (e) => {
      if (!dragState) return;
      
      e.preventDefault();
      
      // Calculate new position relative to field layer
      const deltaX = e.clientX - dragState.startX;
      const deltaY = e.clientY - dragState.startY;
      
      const newLeft = Math.max(0, Math.min(
        dragState.startLeft + deltaX,
        this._fieldLayer.clientWidth - fieldElement.offsetWidth
      ));
      const newTop = Math.max(0, Math.min(
        dragState.startTop + deltaY,
        this._fieldLayer.clientHeight - fieldElement.offsetHeight
      ));
      
      fieldElement.style.left = `${newLeft}px`;
      fieldElement.style.top = `${newTop}px`;
    };
    
    const onDragEnd = () => {
      if (!dragState) return;
      
      fieldElement.classList.remove(getCSSClass('DRAG_ACTIVE'));
      document.removeEventListener('pointermove', onDragMove);
      document.removeEventListener('pointerup', onDragEnd);
      
      this._dispatchFieldUpdate(fieldElement);
      dragState = null;
    };
    
    fieldElement.addEventListener('pointerdown', (e) => {
      // Don't drag when clicking on resize handle or edge elements
      if (e.target.classList.contains(getCSSClass('RESIZE_HANDLE')) || 
          e.target.classList.contains('field-edge')) {
        return;
      }
      
      e.stopPropagation();
      this.setFocusedField(fieldElement);
      
      dragState = {
        startX: e.clientX,
        startY: e.clientY,
        startLeft: fieldElement.offsetLeft,
        startTop: fieldElement.offsetTop
      };
      
      fieldElement.classList.add(getCSSClass('DRAG_ACTIVE'));
      document.addEventListener('pointermove', onDragMove);
      document.addEventListener('pointerup', onDragEnd);
    });
  }

  _setupResizeHandler(fieldElement, resizeHandle) {
    let resizeState = null;
    
    resizeHandle.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.setFocusedField(fieldElement);
      
      resizeState = {
        startX: e.clientX,
        startY: e.clientY,
        initialWidth: fieldElement.offsetWidth,
        initialHeight: fieldElement.offsetHeight,
        initialLeft: fieldElement.offsetLeft,
        initialTop: fieldElement.offsetTop
      };
      
      fieldElement.classList.add(getCSSClass('DRAG_ACTIVE'));
      document.addEventListener('pointermove', onResizeMove);
      document.addEventListener('pointerup', onResizeEnd);
    });
    
    const onResizeMove = (e) => {
      if (!resizeState) return;
      
      e.preventDefault();
      let newWidth = Math.max(
        CONFIG.FIELDS.MIN_WIDTH,
        resizeState.initialWidth + (e.clientX - resizeState.startX)
      );
      let newHeight = Math.max(
        CONFIG.FIELDS.MIN_HEIGHT,
        resizeState.initialHeight + (e.clientY - resizeState.startY)
      );
      
      // Constrain within layer boundaries
      newWidth = Math.min(newWidth, this._fieldLayer.clientWidth - resizeState.initialLeft);
      newHeight = Math.min(newHeight, this._fieldLayer.clientHeight - resizeState.initialTop);
      
      fieldElement.style.width = `${newWidth}px`;
      
      if (fieldElement.dataset.type === CONFIG.FIELDS.TYPES.PHOTO) {
        fieldElement.style.height = `${newHeight}px`;
      } else {
        // Text fields auto-adjust height
        fieldElement.style.height = 'auto';
        const autoHeight = fieldElement.offsetHeight;
        fieldElement.style.height = `${Math.max(CONFIG.FIELDS.MIN_HEIGHT, autoHeight)}px`;
      }
    };
    
    const onResizeEnd = () => {
      if (!resizeState) return;
      
      fieldElement.classList.remove(getCSSClass('DRAG_ACTIVE'));
      document.removeEventListener('pointermove', onResizeMove);
      document.removeEventListener('pointerup', onResizeEnd);
      
      // Final height adjustment for text fields
      if (fieldElement.dataset.type !== CONFIG.FIELDS.TYPES.PHOTO) {
        fieldElement.style.height = 'auto';
        const finalHeight = fieldElement.offsetHeight;
        fieldElement.style.height = `${Math.max(CONFIG.FIELDS.MIN_HEIGHT, finalHeight)}px`;
      }
      
      this._dispatchFieldUpdate(fieldElement);
      resizeState = null;
    };
  }

  _updateTextFieldContent(fieldElement, newText) {
    // Preserve edge elements when updating text
    const textNode = Array.from(fieldElement.childNodes)
      .find(node => node.nodeType === Node.TEXT_NODE);
    
    if (textNode) {
      textNode.textContent = newText;
    } else {
      const newTextNode = document.createTextNode(newText);
      fieldElement.insertBefore(newTextNode, fieldElement.firstChild);
    }
    
    // Handle label edge-based positioning
    const labelEdge = fieldElement.dataset.labelEdge || 'left';
    const currentLeft = fieldElement.offsetLeft;
    const currentTop = fieldElement.offsetTop;
    const currentRight = currentLeft + fieldElement.offsetWidth;
    const currentBottom = currentTop + fieldElement.offsetHeight;
    
    // Measure new content properly
    const measuredSize = this._measureTextContent(
      newText,
      fieldElement.style.fontFamily || CONFIG.FIELDS.DEFAULT_FONT_FAMILY,
      fieldElement.style.fontSize || `${CONFIG.FIELDS.DEFAULT_FONT_SIZE}px`
    );
    
    // Use consistent padding that matches canvas rendering (2px each side)
    const horizontalPadding = 4; // 2px padding on each side = 4px total
    const newWidth = Math.max(CONFIG.FIELDS.MIN_WIDTH, measuredSize.width + horizontalPadding);
    const newHeight = Math.max(CONFIG.FIELDS.MIN_HEIGHT, measuredSize.height);
    
    fieldElement.style.width = `${newWidth}px`;
    fieldElement.style.height = `${newHeight}px`;
    
    // Adjust position based on label edge
    if (labelEdge === 'right') {
      const newLeft = currentRight - newWidth;
      fieldElement.style.left = `${Math.max(0, newLeft)}px`;
    } else if (labelEdge === 'bottom') {
      const newTop = currentBottom - newHeight;
      fieldElement.style.top = `${Math.max(0, newTop)}px`;
    }
    // For 'left' and 'top' edges, no position adjustment needed
  }

  _calculateDefaultPosition() {
    const existingCount = this._fields.size;
    const layerHeight = this._fieldLayer?.clientHeight || 300;
    return (existingCount * CONFIG.FIELDS.STAGGER_OFFSET) % 
           Math.max(CONFIG.FIELDS.STAGGER_OFFSET, layerHeight - CONFIG.FIELDS.STAGGER_OFFSET);
  }

  _getDefaultText(type) {
    const textMap = {
      [CONFIG.FIELDS.TYPES.NAME]: 'Name',
      [CONFIG.FIELDS.TYPES.DOB]: 'Date of Birth',
      [CONFIG.FIELDS.TYPES.ISSUE_DATE]: 'Issue Date',
      [CONFIG.FIELDS.TYPES.EXPIRY_DATE]: 'Expiry Date',
      [CONFIG.FIELDS.TYPES.CIVIL_NO]: 'Civil Number',
      [CONFIG.FIELDS.TYPES.PHOTO]: 'Photo Area'
    };
    return textMap[type] || 'Field';
  }

  _getFieldConfiguration(fieldElement) {
    return {
      id: fieldElement.id,
      type: fieldElement.dataset.type,
      x: fieldElement.offsetLeft,
      y: fieldElement.offsetTop,
      width: fieldElement.offsetWidth,
      height: fieldElement.offsetHeight,
      text: fieldElement.textContent,
      fontFamily: fieldElement.style.fontFamily || CONFIG.FIELDS.DEFAULT_FONT_FAMILY,
      fontSize: parseInt(fieldElement.style.fontSize, 10) || CONFIG.FIELDS.DEFAULT_FONT_SIZE,
      labelEdge: fieldElement.dataset.labelEdge || 'left'
    };
  }

  _dispatchFieldUpdate(fieldElement) {
    const fieldConfig = this._getFieldConfiguration(fieldElement);
    // Use the legacy event name for compatibility
    this._emitFieldEvent('field:moved', fieldConfig);
  }

  _emitFieldEvent(eventName, detail) {
    this._emitEvent(eventName, detail);
    
    // Also emit on field layer for backward compatibility
    if (this._fieldLayer) {
      this._fieldLayer.dispatchEvent(new CustomEvent(eventName, { detail }));
    }
  }

  _emitEvent(eventName, detail) {
    this.dispatchEvent(new CustomEvent(eventName, {
      detail: {
        ...detail,
        timestamp: Date.now()
      }
    }));
  }

  /**
   * Measures text content dimensions accurately
   * @private
   */
  _measureTextContent(text, fontFamily, fontSize) {
    const measureElement = document.createElement('div');
    measureElement.style.position = 'absolute';
    measureElement.style.visibility = 'hidden';
    measureElement.style.whiteSpace = 'nowrap';
    measureElement.style.fontFamily = fontFamily;
    measureElement.style.fontSize = fontSize;
    measureElement.style.padding = '0'; // Don't include padding in measurement
    measureElement.textContent = text;
    
    document.body.appendChild(measureElement);
    const width = measureElement.offsetWidth;
    const height = measureElement.offsetHeight;
    document.body.removeChild(measureElement);
    
    return { width, height };
  }
}

// Create and export singleton instance
export const fieldManager = new FieldManager();

// Legacy exports for backward compatibility
export const initializeFieldManager = (canvas) => fieldManager.initialize(canvas);
export const addField = (type, text) => {
  try {
    return fieldManager.addField(type, { text });
  } catch (error) {
    alert("Please upload an ID template image first.");
    return null;
  }
};
export const getFieldPositions = () => fieldManager.getFieldConfigurations();
export const clearFields = () => fieldManager.clearFields();
export const updateFieldOverlayText = (fieldId, text) => fieldManager.updateFieldText(fieldId, text);
export const hideAllFields = () => fieldManager.hideAllFields();
export const showAllFields = () => fieldManager.showAllFields();
export const updateFieldLayerPosition = () => fieldManager.updatePosition();
export const cleanupFieldManager = () => fieldManager.destroy();
export const enterGeneratedMode = () => fieldManager.enterGeneratedMode();
export const exitGeneratedMode = () => fieldManager.exitGeneratedMode();

// Export field layer reference for backward compatibility
// Note: Access via document.getElementById('fieldLayer') is recommended for tests
export const fieldLayer = { 
  get element() { 
    return fieldManager.fieldLayerElement || document.getElementById('fieldLayer'); 
  } 
};

export default fieldManager;