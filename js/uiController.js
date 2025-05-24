// UI Controller module for Simple ID Generator
// Centralizes all DOM interactions and UI state management

import { CONFIG, getElementId, getMessage, getCSSClass } from './config.js';

export class UIController extends EventTarget {
  constructor() {
    super();
    
    // DOM element references
    this.elements = {};
    this.isInitialized = false;
    
    // UI state
    this.uiState = {
      hasTemplate: false,
      hasFields: false,
      hasGeneratedContent: false,
      isGenerating: false,
      isInEditMode: false,
      selectedFieldId: null
    };
  }

  /**
   * Initialize the UI controller and bind all event listeners
   */
  initialize() {
    if (this.isInitialized) {
      console.warn('UIController already initialized');
      return;
    }

    this._cacheElementReferences();
    this._bindEventListeners();
    this._setupInitialState();
    
    this.isInitialized = true;
    this._emitEvent('ui:initialized');
  }

  /**
   * Update UI state and refresh relevant UI elements
   * @param {Object} stateUpdates - State updates
   */
  updateState(stateUpdates) {
    const previousState = { ...this.uiState };
    Object.assign(this.uiState, stateUpdates);
    
    this._refreshUI(previousState);
    this._emitEvent('ui:state-changed', { 
      previous: previousState, 
      current: this.uiState 
    });
  }

  /**
   * Update progress display
   * @param {Object} progressData - Progress information
   */
  updateProgress(progressData) {
    const { current, total, phase, visible = true } = progressData;
    
    if (!this.elements.progressWrapper) return;
    
    if (visible && total > 0) {
      this.elements.progressWrapper.style.display = 'block';
      
      if (this.elements.progressBar) {
        this.elements.progressBar.max = total;
        this.elements.progressBar.value = current || 0;
      }
      
      if (this.elements.progressText) {
        let text = '';
        if (phase) {
          text = getMessage('PROGRESS_' + phase.toUpperCase(), { current, total });
        } else {
          text = `${current || 0} / ${total}`;
        }
        this.elements.progressText.textContent = text;
      }
    } else {
      this.elements.progressWrapper.style.display = 'none';
      if (this.elements.progressBar) {
        this.elements.progressBar.value = 0;
      }
      if (this.elements.progressText) {
        this.elements.progressText.textContent = '';
      }
    }
  }

  /**
   * Show/hide UI elements
   * @param {string} elementKey - Element key from CONFIG.UI.ELEMENTS
   * @param {boolean} visible - Whether to show the element
   */
  setElementVisibility(elementKey, visible) {
    const element = this.elements[elementKey];
    if (element) {
      element.style.display = visible ? '' : 'none';
    }
  }

  /**
   * Enable/disable UI elements
   * @param {string} elementKey - Element key from CONFIG.UI.ELEMENTS
   * @param {boolean} enabled - Whether to enable the element
   */
  setElementEnabled(elementKey, enabled) {
    const element = this.elements[elementKey];
    if (element) {
      element.disabled = !enabled;
      element.classList.toggle(getCSSClass('BUTTON_DISABLED'), !enabled);
    }
  }

  /**
   * Update button text
   * @param {string} elementKey - Element key
   * @param {string} text - New text content
   */
  setButtonText(elementKey, text) {
    const element = this.elements[elementKey];
    if (element) {
      element.textContent = text;
    }
  }

  /**
   * Get form input values
   * @returns {Object} Form values
   */
  getFormValues() {
    return {
      numIDsToGenerate: parseInt(this.elements.NUM_IDS_INPUT?.value, 10) || 1,
      fontFamily: this.elements.FONT_FAMILY_SELECT?.value || CONFIG.FIELDS.DEFAULT_FONT_FAMILY,
      fontSize: parseInt(this.elements.FONT_SIZE_INPUT?.value, 10) || CONFIG.FIELDS.DEFAULT_FONT_SIZE
    };
  }

  /**
   * Update font controls with field data
   * @param {Object} fieldData - Field configuration
   */
  updateFontControls(fieldData) {
    if (fieldData) {
      if (this.elements.fontFamilySelect) {
        this.elements.fontFamilySelect.value = fieldData.fontFamily || CONFIG.FIELDS.DEFAULT_FONT_FAMILY;
      }
      if (this.elements.fontSizeInput) {
        this.elements.fontSizeInput.value = fieldData.fontSize || CONFIG.FIELDS.DEFAULT_FONT_SIZE;
      }
    }
  }

  /**
   * Show error message
   * @param {string} message - Error message
   * @param {string} title - Error title (optional)
   */
  showError(message, title = 'Error') {
    // Simple alert for now - could be enhanced with custom modal
    alert(`${title}: ${message}`);
  }

  /**
   * Show success message
   * @param {string} message - Success message
   * @param {string} title - Success title (optional)
   */
  showSuccess(message, title = 'Success') {
    // Simple alert for now - could be enhanced with custom notification
    console.log(`${title}: ${message}`);
  }

  /**
   * Get element by key
   * @param {string} elementKey - Element key from CONFIG.UI.ELEMENTS
   * @returns {HTMLElement|null} DOM element
   */
  getElement(elementKey) {
    return this.elements[elementKey] || null;
  }

  /**
   * Clean up event listeners and reset state
   */
  destroy() {
    if (!this.isInitialized) return;
    
    // Remove event listeners
    this._unbindEventListeners();
    
    // Clear element references
    this.elements = {};
    this.isInitialized = false;
    
    this._emitEvent('ui:destroyed');
  }

  // Private methods

  _cacheElementReferences() {
    // Cache all UI element references
    const elementKeys = Object.keys(CONFIG.UI.ELEMENTS);
    
    for (const key of elementKeys) {
      const elementId = CONFIG.UI.ELEMENTS[key];
      const element = document.getElementById(elementId);
      
      if (element) {
        this.elements[key] = element;
      } else {
        console.warn(`Element not found: ${elementId}`);
      }
    }
  }

  _bindEventListeners() {
    // Template upload
    if (this.elements.TEMPLATE_UPLOAD) {
      this.elements.TEMPLATE_UPLOAD.addEventListener('change', (e) => {
        this._handleTemplateUpload(e);
      });
    }

    // Field addition buttons
    const fieldButtons = [
      'ADD_NAME_FIELD', 'ADD_DOB_FIELD', 'ADD_ISSUE_DATE_FIELD',
      'ADD_EXPIRY_DATE_FIELD', 'ADD_CIVIL_NO_FIELD', 'ADD_PHOTO_FIELD'
    ];

    fieldButtons.forEach(buttonKey => {
      const element = this.elements[buttonKey];
      if (element) {
        element.addEventListener('click', () => {
          const fieldType = this._getFieldTypeFromButton(buttonKey);
          this._emitEvent('ui:add-field', { type: fieldType });
        });
      }
    });

    // Font controls
    if (this.elements.FONT_FAMILY_SELECT) {
      this.elements.FONT_FAMILY_SELECT.addEventListener('change', (e) => {
        this._emitEvent('ui:font-changed', { 
          fontFamily: e.target.value,
          type: 'family'
        });
      });
    }

    if (this.elements.FONT_SIZE_INPUT) {
      this.elements.FONT_SIZE_INPUT.addEventListener('change', (e) => {
        this._emitEvent('ui:font-changed', { 
          fontSize: parseInt(e.target.value, 10),
          type: 'size'
        });
      });
    }

    // Generation button
    if (this.elements.GENERATE_BUTTON) {
      this.elements.GENERATE_BUTTON.addEventListener('click', () => {
        const formValues = this.getFormValues();
        this._emitEvent('ui:generate', formValues);
      });
    }

    // Download buttons
    if (this.elements.DOWNLOAD_PREVIEW_BUTTON) {
      this.elements.DOWNLOAD_PREVIEW_BUTTON.addEventListener('click', () => {
        this._emitEvent('ui:download-preview');
      });
    }

    if (this.elements.DOWNLOAD_ALL_BUTTON) {
      this.elements.DOWNLOAD_ALL_BUTTON.addEventListener('click', () => {
        this._emitEvent('ui:download-all');
      });
    }

    // Edit layout button
    if (this.elements.EDIT_LAYOUT_BUTTON) {
      this.elements.EDIT_LAYOUT_BUTTON.addEventListener('click', () => {
        this._emitEvent('ui:edit-layout');
      });
    }
  }

  _unbindEventListeners() {
    // Remove all event listeners by cloning elements (simple approach)
    // In a production app, you'd want to track listeners more carefully
    for (const [key, element] of Object.entries(this.elements)) {
      if (element && element.parentNode) {
        const newElement = element.cloneNode(true);
        element.parentNode.replaceChild(newElement, element);
        this.elements[key] = newElement;
      }
    }
  }

  _setupInitialState() {
    // Set initial UI state
    this.setElementEnabled('GENERATE_BUTTON', false);
    this.setElementEnabled('DOWNLOAD_PREVIEW_BUTTON', false);
    this.setElementEnabled('DOWNLOAD_ALL_BUTTON', false);
    this.setElementVisibility('EDIT_LAYOUT_BUTTON', false);
    this.updateProgress({ visible: false });

    // Check JSZip availability
    const jsZipAvailable = typeof window.JSZip !== 'undefined';
    if (!jsZipAvailable && this.elements.DOWNLOAD_ALL_BUTTON) {
      this.setElementEnabled('DOWNLOAD_ALL_BUTTON', false);
      console.warn('JSZip not available - ZIP download disabled');
    }

    this._emitEvent('ui:initial-state-set');
  }

  _refreshUI(previousState) {
    const state = this.uiState;
    
    // Update generation button - always enabled unless generating
    this.setElementEnabled('GENERATE_BUTTON', !state.isGenerating);

    if (state.isGenerating) {
      this.setButtonText('GENERATE_BUTTON', 'Generating...');
    } else {
      this.setButtonText('GENERATE_BUTTON', 'Generate IDs');
    }

    // Update download buttons
    this.setElementEnabled('DOWNLOAD_PREVIEW_BUTTON', state.hasGeneratedContent);
    
    const jsZipAvailable = typeof window.JSZip !== 'undefined';
    if (state.hasGeneratedContent && jsZipAvailable) {
      this.setElementVisibility('DOWNLOAD_ALL_BUTTON', true);
    } else {
      this.setElementVisibility('DOWNLOAD_ALL_BUTTON', false);
    }

    // Update edit layout button
    this.setElementVisibility('EDIT_LAYOUT_BUTTON', 
      state.hasGeneratedContent && !state.isInEditMode
    );

    // Update field buttons
    const fieldButtonsEnabled = state.hasTemplate && !state.isGenerating;
    const fieldButtons = [
      'ADD_NAME_FIELD', 'ADD_DOB_FIELD', 'ADD_ISSUE_DATE_FIELD',
      'ADD_EXPIRY_DATE_FIELD', 'ADD_CIVIL_NO_FIELD', 'ADD_PHOTO_FIELD'
    ];

    fieldButtons.forEach(buttonKey => {
      this.setElementEnabled(buttonKey, fieldButtonsEnabled);
    });
  }

  _handleTemplateUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      this.showError('Please select a valid image file');
      return;
    }

    // Validate file size
    if (file.size > CONFIG.FILES.MAX_FILE_SIZE) {
      this.showError(`File size too large. Maximum size: ${CONFIG.FILES.MAX_FILE_SIZE / (1024 * 1024)}MB`);
      return;
    }

    // Create image object
    const img = new Image();
    img.onload = () => {
      this._emitEvent('ui:template-loaded', { 
        file, 
        image: img,
        width: img.width,
        height: img.height
      });
    };
    
    img.onerror = () => {
      this.showError('Failed to load image. Please try a different file.');
    };

    // Load image
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  _getFieldTypeFromButton(buttonKey) {
    const typeMap = {
      'ADD_NAME_FIELD': CONFIG.FIELDS.TYPES.NAME,
      'ADD_DOB_FIELD': CONFIG.FIELDS.TYPES.DOB,
      'ADD_ISSUE_DATE_FIELD': CONFIG.FIELDS.TYPES.ISSUE_DATE,
      'ADD_EXPIRY_DATE_FIELD': CONFIG.FIELDS.TYPES.EXPIRY_DATE,
      'ADD_CIVIL_NO_FIELD': CONFIG.FIELDS.TYPES.CIVIL_NO,
      'ADD_PHOTO_FIELD': CONFIG.FIELDS.TYPES.PHOTO
    };
    
    return typeMap[buttonKey] || 'unknown';
  }

  _emitEvent(eventName, detail = {}) {
    this.dispatchEvent(new CustomEvent(eventName, {
      detail: {
        ...detail,
        timestamp: Date.now(),
        uiState: { ...this.uiState }
      }
    }));
  }
}

// Create and export singleton instance
export const uiController = new UIController();
export default uiController;