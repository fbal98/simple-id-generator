// Main application orchestrator for Simple ID Generator
// Coordinates all modules and handles the application lifecycle

import { CONFIG, getEventName } from './config.js';
import { appState } from './state.js';
import { canvasRenderer } from './renderer.js';
import { idGenerator } from './idGenerator.js';
import { exporter } from './exporter.js';
import { fieldManager } from './fieldManager.js';
import { uiController } from './uiController.js';

class SimpleIDGeneratorApp {
  constructor() {
    this.isInitialized = false;
    this.canvas = null;
    this.canvasContext = null;
  }

  /**
   * Initialize the application
   */
  async initialize() {
    try {
      console.log('Initializing Simple ID Generator...');
      
      // Get canvas elements
      this.canvas = document.getElementById(CONFIG.UI.ELEMENTS.ID_CANVAS);
      if (!this.canvas) {
        throw new Error('Canvas element not found');
      }
      this.canvasContext = this.canvas.getContext('2d');

      // Initialize modules
      console.log('Initializing UI Controller...');
      uiController.initialize();
      
      console.log('Initializing Field Manager...');
      fieldManager.initialize(this.canvas);
      
      // Set up event flow
      console.log('Setting up event listeners...');
      this._setupEventListeners();
      
      // Set initial canvas dimensions
      console.log('Setting initial canvas dimensions...');
      this._setInitialCanvasDimensions();
      
      // Render initial state
      console.log('Rendering initial canvas state...');
      this._renderCanvas();
      
      this.isInitialized = true;
      console.log('Application initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize application:', error);
      uiController.showError(`Failed to initialize application: ${error.message}`);
    }
  }

  /**
   * Clean up and destroy the application
   */
  destroy() {
    if (!this.isInitialized) return;
    
    try {
      // Clean up modules
      fieldManager.destroy();
      uiController.destroy();
      appState.reset();
      
      this.isInitialized = false;
      console.log('Application destroyed');
      
    } catch (error) {
      console.error('Error during application cleanup:', error);
    }
  }

  // Private methods

  _setupEventListeners() {
    // UI Controller events
    uiController.addEventListener('ui:template-loaded', (e) => {
      this._handleTemplateLoaded(e.detail);
    });

    uiController.addEventListener('ui:add-field', (e) => {
      this._handleAddField(e.detail);
    });

    uiController.addEventListener('ui:font-changed', (e) => {
      this._handleFontChanged(e.detail);
    });

    uiController.addEventListener('ui:generate', (e) => {
      this._handleGenerate(e.detail);
    });

    uiController.addEventListener('ui:download-preview', () => {
      this._handleDownloadPreview();
    });

    uiController.addEventListener('ui:download-all', () => {
      this._handleDownloadAll();
    });

    uiController.addEventListener('ui:edit-layout', () => {
      this._handleEditLayout();
    });

    // Boldness control
    const boldnessSlider = document.getElementById('boldnessSlider');
    const boldnessValue = document.getElementById('boldnessValue');
    if (boldnessSlider && boldnessValue) {
      boldnessSlider.addEventListener('input', (e) => {
        const weight = e.target.value;
        boldnessValue.textContent = weight;
        appState.setFontWeight(weight);
        
        // Re-render if we have generated IDs
        if (appState.hasGeneratedContent && appState.generatedIds.length > 0) {
          this._rerenderCurrentPreview();
        }
        
        // Update field overlays in edit mode
        if (appState.isInEditMode) {
          fieldManager.updateFontWeight(weight);
        }
      });
    }

    // App State events
    appState.addEventListener(getEventName('TEMPLATE_LOADED'), (e) => {
      this._onTemplateChanged(e.detail);
    });

    appState.addEventListener(getEventName('FIELD_ADDED'), (e) => {
      this._onFieldsChanged(e.detail);
    });

    appState.addEventListener(getEventName('FIELD_REMOVED'), (e) => {
      this._onFieldsChanged(e.detail);
      // If fields were cleared, also clear the fieldManager
      if (e.detail.cleared) {
        fieldManager.clearFields();
      }
    });

    appState.addEventListener(getEventName('GENERATION_COMPLETE'), (e) => {
      this._onGenerationComplete(e.detail);
    });

    // Field Manager events - also listen to legacy event names
    fieldManager.addEventListener(getEventName('FIELD_ADDED'), (e) => {
      this._onFieldManagerUpdate(e.detail);
    });
    
    // Listen to the legacy field:moved event as well
    fieldManager.addEventListener('field:moved', (e) => {
      this._onFieldManagerUpdate(e.detail);
    });

    fieldManager.addEventListener(getEventName('FIELD_UPDATED'), (e) => {
      this._onFieldManagerUpdate(e.detail);
    });

    fieldManager.addEventListener(getEventName('FIELD_FOCUSED'), (e) => {
      this._onFieldFocused(e.detail);
    });
    
    // Also listen on fieldLayer for backward compatibility
    if (fieldManager.fieldLayerElement) {
      fieldManager.fieldLayerElement.addEventListener('field:moved', (e) => {
        this._onFieldManagerUpdate(e.detail);
      });
    }

    // ID Generator events
    idGenerator.addEventListener('generation:progress', (e) => {
      this._onGenerationProgress(e.detail);
    });

    idGenerator.addEventListener('generation:complete', (e) => {
      this._onGenerationComplete(e.detail);
    });

    idGenerator.addEventListener('generation:error', (e) => {
      this._onGenerationError(e.detail);
    });

    // Window events
    window.addEventListener('resize', () => {
      fieldManager.updatePosition();
    });

    window.addEventListener('beforeunload', () => {
      this.destroy();
    });
  }

  _handleTemplateLoaded({ image }) {
    try {
      // Update canvas dimensions
      canvasRenderer.setCanvasDimensions(this.canvas, image.width, image.height);
      
      // Update app state
      appState.setTemplateImage(image);
      
      console.log(`Template loaded: ${image.width}x${image.height}`);
      
    } catch (error) {
      console.error('Error handling template load:', error);
      uiController.showError('Failed to load template image');
    }
  }

  _handleAddField({ type }) {
    try {
      // Check if we have a template first
      if (!appState.hasTemplate) {
        alert('Please upload an ID template image first.');
        return;
      }
      
      // Add field via field manager
      const fieldConfig = fieldManager.addField(type);
      
      // Update app state
      appState.addField(fieldConfig);
      
    } catch (error) {
      console.error('Error adding field:', error);
      // If it's the initialization error, show the proper message
      if (error.message.includes('not initialized')) {
        alert('Please upload an ID template image first.');
      } else {
        uiController.showError('Failed to add field');
      }
    }
  }

  _handleFontChanged({ fontFamily, fontSize, type }) {
    const selectedFieldId = appState.selectedFieldId;
    if (!selectedFieldId) return;

    try {
      const updates = {};
      if (type === 'family' && fontFamily) updates.fontFamily = fontFamily;
      if (type === 'size' && fontSize) updates.fontSize = fontSize;
      
      appState.updateField(selectedFieldId, updates);
      
    } catch (error) {
      console.error('Error updating font:', error);
    }
  }

  _handleGenerate({ numIDsToGenerate }) {
    if (!appState.hasTemplate) {
      alert('Please upload a template image first.');
      return;
    }
    
    if (!appState.hasFields) {
      alert('Please add some fields to the template.');
      return;
    }

    this._generateIDs(numIDsToGenerate);
  }

  _handleDownloadPreview() {
    const generatedIds = appState.generatedIds;
    if (generatedIds.length === 0) {
      alert('No ID generated yet to download. Please generate IDs first.');
      return;
    }

    try {
      exporter.exportSinglePNG(generatedIds[0]);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download preview');
    }
  }

  _handleDownloadAll() {
    const generatedIds = appState.generatedIds;
    if (generatedIds.length < 2) {
      uiController.showError('Generate at least 2 IDs to download ZIP');
      return;
    }

    try {
      exporter.exportZIP(generatedIds, CONFIG.FILES.ZIP_FILENAME, (progress) => {
        console.log('ZIP progress:', progress);
      });
    } catch (error) {
      console.error('ZIP download error:', error);
      uiController.showError('Failed to download ZIP file');
    }
  }

  _handleEditLayout() {
    try {
      appState.setEditMode(true);
      fieldManager.exitGeneratedMode();
      fieldManager.showAllFields();
      
      // Update field overlays with generated content
      const lastData = appState.lastGeneratedData;
      if (lastData && lastData.text) {
        this._updateFieldOverlaysWithData(lastData.text);
      }
      
      // Apply current font weight to field overlays
      fieldManager.updateFontWeight(appState.fontWeight);
      
      // Show only template on canvas
      this._renderCanvas();
      
    } catch (error) {
      console.error('Error entering edit mode:', error);
      uiController.showError('Failed to enter edit mode');
    }
  }

  async _generateIDs(count) {
    try {
      // Update state
      appState.setGenerationInProgress(true);
      fieldManager.enterGeneratedMode();
      fieldManager.hideAllFields();
      
      // Update UI
      uiController.updateState({ isGenerating: true });
      uiController.updateProgress({ current: 0, total: count, visible: true });
      
      // Generate IDs
      const result = await idGenerator.generateIds(
        appState.templateImage,
        appState.fields,
        count,
        {
          onProgress: (progress) => {
            uiController.updateProgress(progress);
          }
        }
      );
      
      // Update state with results
      appState.setGeneratedIds(result.ids);
      if (result.ids.length > 0) {
        appState.setLastGeneratedData(result.ids[0].instanceData);
        
        // Show first ID on canvas
        this._renderGeneratedPreview(result.ids[0]);
      }
      
      // Show success message with count
      if (result.successful > 0) {
        uiController.showSuccess(`Successfully generated ${result.successful} ID${result.successful > 1 ? 's' : ''}`);
      }
      
      if (result.failed > 0) {
        console.warn(`Failed to generate ${result.failed} IDs`);
      }
      
    } catch (error) {
      console.error('Generation error:', error);
      let errorMessage = 'Failed to generate IDs';
      if (error.message.includes('fetch')) {
        errorMessage = 'Failed to fetch AI faces. Please check your internet connection.';
      }
      uiController.showError(errorMessage);
      appState.clearGeneratedIds();
    } finally {
      appState.setGenerationInProgress(false);
      uiController.updateState({ isGenerating: false });
      uiController.updateProgress({ visible: false });
      // Don't show fields here - they should remain hidden when showing generated IDs
    }
  }

  _renderGeneratedPreview(idData) {
    try {
      const img = new Image();
      img.onload = () => {
        canvasRenderer.clearCanvas(this.canvasContext);
        this.canvasContext.drawImage(img, 0, 0);
        // Fields should already be hidden and in generated mode
      };
      img.onerror = () => {
        console.error('Failed to load generated ID image');
        uiController.showError('Failed to display generated ID');
      };
      img.src = idData.dataUrl;
    } catch (error) {
      console.error('Error rendering preview:', error);
      uiController.showError('Failed to display generated ID');
    }
  }

  async _rerenderCurrentPreview() {
    if (!appState.hasGeneratedContent || appState.generatedIds.length === 0) return;
    
    try {
      const fontWeight = appState.fontWeight;
      
      // Get the proper scale factors
      const displayCanvas = document.getElementById('idCanvas');
      let scaleFactors = { scaleX: 1, scaleY: 1 };
      
      if (displayCanvas && appState.templateImage) {
        const displayRect = displayCanvas.getBoundingClientRect();
        scaleFactors = canvasRenderer.calculateScaleFactors(
          { width: displayRect.width, height: displayRect.height },
          { width: appState.templateImage.width, height: appState.templateImage.height }
        );
      }
      
      // Re-render all generated IDs with new font weight
      for (let i = 0; i < appState.generatedIds.length; i++) {
        const currentId = appState.generatedIds[i];
        
        // Re-render with new font weight using the template image dimensions
        const { canvas: offscreenCanvas, ctx: offscreenCtx } = canvasRenderer.createOffscreenCanvas(
          appState.templateImage.width,
          appState.templateImage.height
        );
        
        // Render the ID with the new font weight and proper scale factors
        canvasRenderer.renderGeneratedId(
          offscreenCtx,
          appState.templateImage,
          appState.fields,
          currentId.instanceData.text,
          currentId.instanceData.photos,
          scaleFactors.scaleX,
          scaleFactors.scaleY,
          fontWeight
        );
        
        // Convert to data URL
        const dataUrl = await canvasRenderer.canvasToDataURL(offscreenCanvas);
        
        // Update the stored data URL so downloads reflect the change
        currentId.dataUrl = dataUrl;
        
        // If this is the first ID, display it
        if (i === 0) {
          const img = new Image();
          img.onload = () => {
            canvasRenderer.clearCanvas(this.canvasContext);
            this.canvasContext.drawImage(img, 0, 0, displayCanvas.width, displayCanvas.height);
          };
          img.src = dataUrl;
        }
      }
      
    } catch (error) {
      console.error('Error re-rendering preview:', error);
    }
  }

  _updateFieldOverlaysWithData(textData) {
    for (const [fieldId, text] of Object.entries(textData)) {
      fieldManager.updateFieldText(fieldId, text);
    }
  }

  _renderCanvas() {
    canvasRenderer.renderTemplate(this.canvasContext, appState.templateImage, this.canvas);
  }

  _setInitialCanvasDimensions() {
    if (!appState.hasTemplate) {
      try {
        canvasRenderer.setCanvasDimensions(this.canvas, CONFIG.CANVAS.DEFAULT_WIDTH, CONFIG.CANVAS.DEFAULT_HEIGHT);
        this._renderCanvas();
      } catch (error) {
        console.error('Error setting initial canvas dimensions:', error);
      }
    }
  }

  // Event handlers for state changes
  _onTemplateChanged({ hasTemplate }) {
    uiController.updateState({ hasTemplate });
    this._renderCanvas();
    fieldManager.updatePosition();
  }

  _onFieldsChanged({ totalFields }) {
    uiController.updateState({ hasFields: totalFields > 0 });
  }

  _onFieldManagerUpdate(fieldConfig) {
    try {
      appState.updateField(fieldConfig.id, fieldConfig);
    } catch (error) {
      // Field might not exist in state yet
      console.debug('Field update ignored:', error.message);
    }
  }

  _onFieldFocused({ fieldId }) {
    appState.setSelectedField(fieldId);
    
    // Update UI font controls
    if (fieldId) {
      const field = appState.getField(fieldId);
      if (field) {
        uiController.updateFontControls(field);
      }
    }
  }

  _onGenerationProgress(progress) {
    uiController.updateProgress(progress);
  }

  _onGenerationComplete(detail = {}) {
    // Handle both direct calls and state change events
    const ids = detail.ids || appState.generatedIds || [];
    const hasContent = detail.hasContent !== undefined ? detail.hasContent : ids.length > 0;
    const idCount = detail.count !== undefined ? detail.count : ids.length;
    
    uiController.updateState({ 
      hasGeneratedContent: hasContent,
      isInEditMode: false,
      generatedIdCount: idCount
    });
    
    // Show/hide boldness control based on content
    const boldnessControl = document.getElementById('boldnessControl');
    const boldnessHr = document.getElementById('boldnessHr');
    if (boldnessControl && boldnessHr) {
      const display = hasContent ? 'block' : 'none';
      boldnessControl.style.display = display;
      boldnessHr.style.display = display;
    }
    
    if (ids.length > 0) {
      uiController.showSuccess(`Generated ${ids.length} IDs successfully`);
    }
  }

  _onGenerationError({ error }) {
    uiController.showError(`Generation failed: ${error}`);
    uiController.updateState({ 
      hasGeneratedContent: false,
      isGenerating: false 
    });
  }
}

// Create and initialize the application
const app = new SimpleIDGeneratorApp();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => app.initialize());
} else {
  app.initialize();
}

// Export for debugging/testing
window.app = app; // Expose globally for tests
window.appState = appState; // Expose state for tests
window.fieldManager = fieldManager; // Expose field manager for tests
export default app;