// Configuration module for Simple ID Generator
// Contains all magic numbers, hardcoded strings, and application constants

export const CONFIG = Object.freeze({
  // Canvas Configuration
  CANVAS: {
    DEFAULT_WIDTH: 600,
    DEFAULT_HEIGHT: 380,
    PLACEHOLDER_TEXT: 'Upload a template image',
    PLACEHOLDER_FONT: '18px Arial',
    BACKGROUND_COLOR: '#f0f0f0'
  },

  // Field Configuration
  FIELDS: {
    MIN_WIDTH: 80,
    MIN_HEIGHT: 30,
    DEFAULT_WIDTH: 100,
    DEFAULT_HEIGHT: 120, // For photo fields
    DEFAULT_TEXT_HEIGHT: 25,
    TEXT_PADDING: '8px 12px',
    STAGGER_OFFSET: 25,
    POSITION_LEFT: 10,
    DEFAULT_FONT_FAMILY: 'Arial',
    DEFAULT_FONT_SIZE: 16,
    
    // Field type definitions
    TYPES: {
      NAME: 'name',
      DOB: 'dob',
      ISSUE_DATE: 'issueDate',
      EXPIRY_DATE: 'expiryDate',
      CIVIL_NO: 'civilNo',
      PHOTO: 'photo'
    }
  },

  // API Configuration
  API: {
    FACE_ENDPOINT: '/api/face',
    REQUEST_TIMEOUT: 10000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000
  },

  // UI Configuration
  UI: {
    FONT_FAMILIES: ['Arial', 'Courier New', 'Times New Roman', 'Verdana'],
    PROGRESS_UPDATE_INTERVAL: 100,
    DEBOUNCE_DELAY: 300,
    
    // Element IDs (for consistency and easy updates)
    ELEMENTS: {
      TEMPLATE_UPLOAD: 'templateUpload',
      ID_CANVAS: 'idCanvas',
      CANVAS_WRAPPER: 'canvasWrapper',
      FIELD_LAYER: 'fieldLayer',
      
      // Field buttons
      ADD_NAME_FIELD: 'addNameField',
      ADD_DOB_FIELD: 'addDOBField',
      ADD_ISSUE_DATE_FIELD: 'addIssueDateField',
      ADD_EXPIRY_DATE_FIELD: 'addExpiryDateField',
      ADD_CIVIL_NO_FIELD: 'addCivilNoField',
      ADD_PHOTO_FIELD: 'addPhotoField',
      
      // Generation controls
      NUM_IDS_INPUT: 'numIDsToGenerate',
      GENERATE_BUTTON: 'generateButton',
      DOWNLOAD_PREVIEW_BUTTON: 'downloadPreviewButton',
      EDIT_LAYOUT_BUTTON: 'editLayoutButton',
      DOWNLOAD_ALL_BUTTON: 'downloadAllButton',
      
      // Font controls
      FONT_FAMILY_SELECT: 'fontFamilySelect',
      FONT_SIZE_INPUT: 'fontSizeInput',
      
      // Progress elements
      PROGRESS_WRAPPER: 'progressWrapper',
      PROGRESS_BAR: 'generationProgress',
      PROGRESS_TEXT: 'progressText'
    }
  },

  // File Configuration
  FILES: {
    ACCEPTED_IMAGE_TYPES: 'image/*',
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
    EXPORT_FORMATS: {
      PNG: 'image/png',
      JPEG: 'image/jpeg'
    },
    ZIP_FILENAME: 'generated-ids.zip'
  },

  // Generation Configuration
  GENERATION: {
    DEFAULT_COUNT: 1,
    MAX_COUNT: 100,
    MIN_COUNT: 1,
    BATCH_SIZE: 10,
    CONCURRENT_REQUESTS: 3
  },

  // Messages and Text
  MESSAGES: {
    UPLOAD_TEMPLATE: 'Upload a template image to get started',
    GENERATION_COMPLETE: 'Generation complete!',
    GENERATION_ERROR: 'Error during generation',
    DOWNLOAD_ERROR: 'Error downloading file',
    NO_JSZIP: 'JSZip not available for ZIP downloads',
    FIELD_ADDED: 'Field added successfully',
    FIELD_REMOVED: 'Field removed',
    
    // Progress messages
    PROGRESS: {
      GENERATING: 'Generating ID {current} of {total}...',
      FETCHING_FACES: 'Fetching face images...',
      RENDERING: 'Rendering IDs...',
      PREPARING_DOWNLOAD: 'Preparing download...'
    }
  },

  // Event Names
  EVENTS: {
    FIELD_FOCUSED: 'field:focused',
    FIELD_UPDATED: 'field:updated',
    FIELD_MOVED: 'field:moved',
    FIELD_RESIZED: 'field:resized',
    FIELD_REMOVED: 'field:removed',
    FIELD_ADDED: 'field:added',
    
    TEMPLATE_LOADED: 'template:loaded',
    TEMPLATE_ERROR: 'template:error',
    
    GENERATION_START: 'generation:start',
    GENERATION_PROGRESS: 'generation:progress',
    GENERATION_COMPLETE: 'generation:complete',
    GENERATION_ERROR: 'generation:error',
    
    STATE_CHANGED: 'state:changed'
  },

  // CSS Classes
  CSS_CLASSES: {
    FIELD: 'field',
    FIELD_FOCUSED: 'focused',
    FIELD_GENERATED_MODE: 'generated-mode',
    RESIZE_HANDLE: 'resize-handle',
    DRAG_ACTIVE: 'dragging',
    BUTTON_DISABLED: 'disabled',
    PROGRESS_ACTIVE: 'active',
    ERROR_STATE: 'error',
    SUCCESS_STATE: 'success'
  },

  // Development Configuration
  DEV: {
    DEBUG_MODE: false,
    LOG_LEVEL: 'warn',
    ENABLE_PERFORMANCE_MONITORING: false
  }
});

// Helper functions for accessing nested config values
export const getElementId = (key) => CONFIG.UI.ELEMENTS[key];
export const getFieldType = (key) => CONFIG.FIELDS.TYPES[key];
export const getMessage = (key, params = {}) => {
  let message = CONFIG.MESSAGES[key] || key;
  Object.entries(params).forEach(([param, value]) => {
    message = message.replace(`{${param}}`, value);
  });
  return message;
};
export const getEventName = (key) => CONFIG.EVENTS[key];
export const getCSSClass = (key) => CONFIG.CSS_CLASSES[key];

// Validation helpers
export const isValidFieldType = (type) => Object.values(CONFIG.FIELDS.TYPES).includes(type);
export const isValidFontFamily = (font) => CONFIG.UI.FONT_FAMILIES.includes(font);
export const isValidGenerationCount = (count) => 
  count >= CONFIG.GENERATION.MIN_COUNT && count <= CONFIG.GENERATION.MAX_COUNT;

export default CONFIG;