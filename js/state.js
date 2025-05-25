// State management module for Simple ID Generator
// Centralized state with validation and event emission

import { CONFIG, getEventName, isValidFieldType } from './config.js';

export class AppState extends EventTarget {
  // Private fields for encapsulation
  _templateImage = null;
  _fields = new Map();
  _generatedIds = [];
  _selectedFieldId = null;
  _isInEditMode = false;
  _lastGeneratedData = null;
  _isContentGenerated = false;
  _fieldCounter = 0;
  _generationInProgress = false;
  _fontWeight = 600; // Default font weight

  constructor() {
    super();
    this._validateInitialState();
  }

  // Template Image Management
  get templateImage() {
    return this._templateImage;
  }

  setTemplateImage(image) {
    if (image && !(image instanceof HTMLImageElement)) {
      throw new Error('Template image must be an HTMLImageElement or null');
    }
    
    const previousImage = this._templateImage;
    this._templateImage = image;
    
    // Clear fields when template changes
    if (previousImage !== image) {
      this.clearFields();
    }
    
    this._emitChange(getEventName('TEMPLATE_LOADED'), {
      image,
      hasTemplate: !!image
    });
  }

  get hasTemplate() {
    return !!this._templateImage;
  }

  // Fields Management
  get fields() {
    return new Map(this._fields); // Return a copy to prevent external mutation
  }

  getField(fieldId) {
    return this._fields.get(fieldId);
  }

  addField(fieldConfig) {
    const { id, type, x = CONFIG.FIELDS.POSITION_LEFT, y, width, height, fontFamily, fontSize, text, labelEdge } = fieldConfig;
    
    if (!isValidFieldType(type)) {
      throw new Error(`Invalid field type: ${type}`);
    }

    // Use the provided ID from fieldConfig instead of generating a new one
    const fieldId = id || `field_${++this._fieldCounter}`;
    
    // Calculate default position if not provided
    const defaultY = this._calculateDefaultFieldPosition();
    
    const field = {
      id: fieldId,
      type,
      x: Math.max(0, x),
      y: y !== undefined ? Math.max(0, y) : defaultY,
      width: Math.max(CONFIG.FIELDS.MIN_WIDTH, width || this._getDefaultWidth(type)),
      height: Math.max(CONFIG.FIELDS.MIN_HEIGHT, height || this._getDefaultHeight(type)),
      fontFamily: fontFamily || CONFIG.FIELDS.DEFAULT_FONT_FAMILY,
      fontSize: fontSize || CONFIG.FIELDS.DEFAULT_FONT_SIZE,
      text: text || this._getDefaultText(type),
      labelEdge: labelEdge || 'left',
      createdAt: Date.now()
    };

    this._fields.set(fieldId, field);
    
    this._emitChange(getEventName('FIELD_ADDED'), {
      fieldId,
      field: { ...field },
      totalFields: this._fields.size
    });
    
    return fieldId;
  }

  updateField(fieldId, updates) {
    const field = this._fields.get(fieldId);
    if (!field) {
      throw new Error(`Field not found: ${fieldId}`);
    }

    const updatedField = { 
      ...field, 
      ...updates,
      // Ensure constraints are maintained
      width: updates.width ? Math.max(CONFIG.FIELDS.MIN_WIDTH, updates.width) : field.width,
      height: updates.height ? Math.max(CONFIG.FIELDS.MIN_HEIGHT, updates.height) : field.height,
      x: updates.x !== undefined ? Math.max(0, updates.x) : field.x,
      y: updates.y !== undefined ? Math.max(0, updates.y) : field.y,
      updatedAt: Date.now()
    };

    this._fields.set(fieldId, updatedField);
    
    this._emitChange(getEventName('FIELD_UPDATED'), {
      fieldId,
      field: { ...updatedField },
      updates
    });
  }

  removeField(fieldId) {
    const field = this._fields.get(fieldId);
    if (!field) {
      return false;
    }

    this._fields.delete(fieldId);
    
    // Clear selection if this field was selected
    if (this._selectedFieldId === fieldId) {
      this.setSelectedField(null);
    }
    
    this._emitChange(getEventName('FIELD_REMOVED'), {
      fieldId,
      field: { ...field },
      totalFields: this._fields.size
    });
    
    return true;
  }

  clearFields() {
    const fieldCount = this._fields.size;
    this._fields.clear();
    this._selectedFieldId = null;
    
    if (fieldCount > 0) {
      this._emitChange(getEventName('FIELD_REMOVED'), {
        fieldId: null,
        field: null,
        totalFields: 0,
        cleared: true
      });
    }
  }

  get fieldCount() {
    return this._fields.size;
  }

  get hasFields() {
    return this._fields.size > 0;
  }

  // Field Selection Management
  get selectedFieldId() {
    return this._selectedFieldId;
  }

  setSelectedField(fieldId) {
    if (fieldId && !this._fields.has(fieldId)) {
      throw new Error(`Cannot select non-existent field: ${fieldId}`);
    }

    const previousSelection = this._selectedFieldId;
    this._selectedFieldId = fieldId;
    
    this._emitChange(getEventName('FIELD_FOCUSED'), {
      fieldId,
      previousFieldId: previousSelection,
      hasSelection: !!fieldId
    });
  }

  get selectedField() {
    return this._selectedFieldId ? this._fields.get(this._selectedFieldId) : null;
  }

  // Generated IDs Management
  get generatedIds() {
    return [...this._generatedIds]; // Return a copy
  }
  
  // Alias for backward compatibility with tests
  getGeneratedIds() {
    return this.generatedIds;
  }

  setGeneratedIds(ids) {
    if (!Array.isArray(ids)) {
      throw new Error('Generated IDs must be an array');
    }

    this._generatedIds = ids.map(id => ({ ...id })); // Deep copy
    this._isContentGenerated = ids.length > 0;
    
    this._emitChange(getEventName('GENERATION_COMPLETE'), {
      ids: this.generatedIds,
      count: ids.length,
      hasContent: this._isContentGenerated
    });
  }

  addGeneratedId(idData) {
    if (!idData.name || !idData.dataUrl) {
      throw new Error('Generated ID must have name and dataUrl properties');
    }

    this._generatedIds.push({ ...idData });
    this._isContentGenerated = true;
    
    this._emitChange(getEventName('GENERATION_PROGRESS'), {
      currentCount: this._generatedIds.length,
      latestId: { ...idData }
    });
  }

  clearGeneratedIds() {
    const hadContent = this._isContentGenerated;
    this._generatedIds = [];
    this._isContentGenerated = false;
    this._lastGeneratedData = null;
    this._fontWeight = 600; // Reset font weight when clearing generated IDs
    
    if (hadContent) {
      this._emitChange(getEventName('GENERATION_COMPLETE'), {
        ids: [],
        count: 0,
        hasContent: false,
        cleared: true
      });
    }
  }

  get generatedIdCount() {
    return this._generatedIds.length;
  }

  get hasGeneratedContent() {
    return this._isContentGenerated;
  }

  // Edit Mode Management
  get isInEditMode() {
    return this._isInEditMode;
  }

  setEditMode(enabled) {
    if (typeof enabled !== 'boolean') {
      throw new Error('Edit mode must be a boolean value');
    }

    const wasInEditMode = this._isInEditMode;
    this._isInEditMode = enabled;
    
    if (wasInEditMode !== enabled) {
      this._emitChange(getEventName('STATE_CHANGED'), {
        editMode: enabled,
        previousEditMode: wasInEditMode,
        stateType: 'editMode'
      });
    }
  }

  // Generation Progress Management
  get isGenerationInProgress() {
    return this._generationInProgress;
  }

  setGenerationInProgress(inProgress) {
    if (typeof inProgress !== 'boolean') {
      throw new Error('Generation progress must be a boolean value');
    }

    const wasInProgress = this._generationInProgress;
    this._generationInProgress = inProgress;
    
    if (wasInProgress !== inProgress) {
      this._emitChange(inProgress ? getEventName('GENERATION_START') : getEventName('GENERATION_COMPLETE'), {
        inProgress,
        previousState: wasInProgress
      });
    }
  }

  // Last Generated Data Management
  get lastGeneratedData() {
    return this._lastGeneratedData ? { ...this._lastGeneratedData } : null;
  }

  setLastGeneratedData(data) {
    this._lastGeneratedData = data ? { ...data } : null;
  }

  // Font Weight Management
  get fontWeight() {
    return this._fontWeight;
  }

  setFontWeight(weight) {
    const numWeight = parseInt(weight, 10);
    if (isNaN(numWeight) || numWeight < 100 || numWeight > 900 || numWeight % 100 !== 0) {
      throw new Error('Font weight must be a number between 100-900 in increments of 100');
    }

    const previousWeight = this._fontWeight;
    this._fontWeight = numWeight;

    if (previousWeight !== numWeight) {
      this._emitChange(getEventName('FONT_WEIGHT_CHANGED'), {
        fontWeight: numWeight,
        previousWeight
      });
    }
  }

  // State Validation and Serialization
  isValid() {
    return {
      hasTemplate: this.hasTemplate,
      hasFields: this.hasFields,
      canGenerate: this.hasTemplate && this.hasFields && !this._generationInProgress,
      canDownload: this.hasGeneratedContent,
      canEdit: this.hasTemplate && this.hasFields
    };
  }

  getSnapshot() {
    return {
      hasTemplate: this.hasTemplate,
      fieldCount: this.fieldCount,
      selectedFieldId: this.selectedFieldId,
      isInEditMode: this.isInEditMode,
      generatedIdCount: this.generatedIdCount,
      hasGeneratedContent: this.hasGeneratedContent,
      isGenerationInProgress: this.isGenerationInProgress,
      validity: this.isValid(),
      timestamp: Date.now()
    };
  }

  // Reset entire state
  reset() {
    this._templateImage = null;
    this._fields.clear();
    this._generatedIds = [];
    this._selectedFieldId = null;
    this._isInEditMode = false;
    this._lastGeneratedData = null;
    this._isContentGenerated = false;
    this._fieldCounter = 0;
    this._generationInProgress = false;
    this._fontWeight = 600; // Reset to default

    this._emitChange(getEventName('STATE_CHANGED'), {
      stateType: 'reset',
      snapshot: this.getSnapshot()
    });
  }

  // Private helper methods
  _calculateDefaultFieldPosition() {
    const existingFields = Array.from(this._fields.values());
    const layerHeight = 300; // Default layer height for positioning
    return (existingFields.length * CONFIG.FIELDS.STAGGER_OFFSET) % Math.max(CONFIG.FIELDS.STAGGER_OFFSET, layerHeight - CONFIG.FIELDS.STAGGER_OFFSET);
  }

  _getDefaultWidth(type) {
    return type === CONFIG.FIELDS.TYPES.PHOTO ? CONFIG.FIELDS.DEFAULT_WIDTH : CONFIG.FIELDS.DEFAULT_WIDTH;
  }

  _getDefaultHeight(type) {
    return type === CONFIG.FIELDS.TYPES.PHOTO ? CONFIG.FIELDS.DEFAULT_HEIGHT : CONFIG.FIELDS.DEFAULT_TEXT_HEIGHT;
  }

  _getDefaultText(type) {
    const textMap = {
      [CONFIG.FIELDS.TYPES.NAME]: 'Name',
      [CONFIG.FIELDS.TYPES.DOB]: 'Date of Birth',
      [CONFIG.FIELDS.TYPES.ISSUE_DATE]: 'Issue Date',
      [CONFIG.FIELDS.TYPES.EXPIRY_DATE]: 'Expiry Date',
      [CONFIG.FIELDS.TYPES.CIVIL_NO]: 'Civil Number',
      [CONFIG.FIELDS.TYPES.PHOTO]: 'Photo'
    };
    return textMap[type] || 'Field';
  }

  _emitChange(eventName, detail) {
    this.dispatchEvent(new CustomEvent(eventName, { 
      detail: {
        ...detail,
        timestamp: Date.now(),
        stateSnapshot: this.getSnapshot()
      }
    }));
  }

  _validateInitialState() {
    // Perform any initial state validation
    if (CONFIG.DEV.DEBUG_MODE) {
      console.debug('AppState initialized with configuration:', CONFIG);
    }
  }
}

// Create and export singleton instance
export const appState = new AppState();
export default appState;