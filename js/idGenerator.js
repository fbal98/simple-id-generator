// ID Generation module for Simple ID Generator
// Handles the complete workflow of generating multiple IDs with data and images

import { CONFIG, getEventName, getMessage, isValidGenerationCount } from './config.js';
import * as dataGenerator from './dataGenerator.js';
import { canvasRenderer } from './renderer.js';

export class IDGenerator extends EventTarget {
  constructor() {
    super();
    this.isGenerating = false;
    this.abortController = null;
  }

  /**
   * Generates multiple IDs based on template and field configuration
   * @param {HTMLImageElement} templateImage - Template image
   * @param {Map|Object} fields - Field configurations
   * @param {number} count - Number of IDs to generate
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Generation result with IDs and errors
   */
  async generateIds(templateImage, fields, count, options = {}) {
    if (this.isGenerating) {
      throw new Error('Generation already in progress');
    }

    // Validate inputs
    this._validateGenerationInputs(templateImage, fields, count);

    // Set up generation state
    this.isGenerating = true;
    this.abortController = new AbortController();

    const {
      onProgress = () => {},
      concurrent = CONFIG.GENERATION.CONCURRENT_REQUESTS,
      batchSize = CONFIG.GENERATION.BATCH_SIZE
    } = options;

    try {
      this._emitProgress('generation:start', { total: count });

      // Convert fields to object if it's a Map
      const fieldsObject = fields instanceof Map ? Object.fromEntries(fields) : fields;

      // Generate IDs in batches for better performance
      const generatedIds = [];
      const errors = [];

      for (let startIndex = 0; startIndex < count; startIndex += batchSize) {
        const endIndex = Math.min(startIndex + batchSize, count);
        const batchCount = endIndex - startIndex;

        const batchPromises = [];
        for (let i = 0; i < batchCount; i++) {
          const idIndex = startIndex + i;
          batchPromises.push(
            this._generateSingleId(templateImage, fieldsObject, idIndex, this.abortController.signal)
          );
        }

        // Process batch with controlled concurrency
        const batchResults = await this._processBatchWithConcurrency(batchPromises, concurrent);

        // Separate successful generations from errors
        batchResults.forEach((result, index) => {
          const idIndex = startIndex + index;
          if (result.success) {
            generatedIds[idIndex] = result.data;
          } else {
            errors.push({
              index: idIndex,
              error: result.error
            });
          }

          // Report progress
          const progress = {
            current: idIndex + 1,
            total: count,
            completed: generatedIds.filter(Boolean).length,
            errors: errors.length
          };
          onProgress(progress);
          this._emitProgress('generation:progress', progress);
        });

        // Check for abort signal
        if (this.abortController.signal.aborted) {
          throw new Error('Generation was cancelled');
        }
      }

      const result = {
        ids: generatedIds.filter(Boolean), // Remove null entries
        errors,
        total: count,
        successful: generatedIds.filter(Boolean).length,
        failed: errors.length
      };

      this._emitProgress('generation:complete', result);
      return result;

    } catch (error) {
      const errorResult = {
        ids: [],
        errors: [{ index: -1, error: error.message }],
        total: count,
        successful: 0,
        failed: count
      };

      this._emitProgress('generation:error', { error: error.message, result: errorResult });
      throw error;

    } finally {
      this.isGenerating = false;
      this.abortController = null;
    }
  }

  /**
   * Cancels ongoing generation
   */
  cancel() {
    if (this.isGenerating && this.abortController) {
      this.abortController.abort();
    }
  }

  /**
   * Fetches an AI-generated face image
   * @param {AbortSignal} signal - Abort signal for cancellation
   * @returns {Promise<HTMLImageElement|null>} Image element or null on error
   */
  async fetchAIFace(signal) {
    try {
      const response = await fetch(CONFIG.API.FACE_ENDPOINT, {
        signal,
        cache: 'no-cache'
      });

      if (!response.ok) {
        let errorText = response.statusText;
        try {
          const bodyText = await response.text();
          if (bodyText) errorText += ` - ${bodyText}`;
        } catch (e) {
          // Ignore if can't read body
        }
        throw new Error(`Failed to fetch AI face: ${response.status} ${errorText}`);
      }

      const blob = await response.blob();
      const imageData = await this._blobToDataURL(blob);

      return await this._loadImageFromDataURL(imageData);

    } catch (error) {
      if (error.name === 'AbortError') {
        throw error;
      }
      console.error('Error fetching AI face:', error.message);
      return null; // Handle gracefully by returning null
    }
  }

  // Private methods

  /**
   * Validates generation inputs
   * @private
   */
  _validateGenerationInputs(templateImage, fields, count) {
    if (!templateImage || !(templateImage instanceof HTMLImageElement)) {
      throw new Error('Valid template image is required');
    }

    if (!fields || (typeof fields !== 'object')) {
      throw new Error('Fields configuration is required');
    }

    const fieldCount = fields instanceof Map ? fields.size : Object.keys(fields).length;
    if (fieldCount === 0) {
      throw new Error('At least one field is required');
    }

    if (!isValidGenerationCount(count)) {
      throw new Error(`Invalid generation count. Must be between ${CONFIG.GENERATION.MIN_COUNT} and ${CONFIG.GENERATION.MAX_COUNT}`);
    }
  }

  /**
   * Generates a single ID with all its data and images
   * @private
   */
  async _generateSingleId(templateImage, fields, index, signal) {
    try {
      const idInstanceData = { text: {}, photos: {} };
      const photoPromises = [];

      // Generate data for each field
      for (const [fieldId, field] of Object.entries(fields)) {
        if (signal.aborted) {
          throw new Error('Generation cancelled');
        }

        switch (field.type) {
          case CONFIG.FIELDS.TYPES.NAME:
            idInstanceData.text[field.id] = dataGenerator.getRandomName();
            break;
          case CONFIG.FIELDS.TYPES.DOB:
            idInstanceData.text[field.id] = dataGenerator.getRandomDate(1970, 2004);
            break;
          case CONFIG.FIELDS.TYPES.ISSUE_DATE:
            idInstanceData.text[field.id] = dataGenerator.getRandomDate(2020, 2023);
            break;
          case CONFIG.FIELDS.TYPES.EXPIRY_DATE:
            idInstanceData.text[field.id] = dataGenerator.getRandomDate(2024, 2030);
            break;
          case CONFIG.FIELDS.TYPES.CIVIL_NO:
            idInstanceData.text[field.id] = dataGenerator.getRandomCivilNumber();
            break;
          case CONFIG.FIELDS.TYPES.PHOTO:
            photoPromises.push(
              this.fetchAIFace(signal)
                .then(img => {
                  idInstanceData.photos[field.id] = img;
                })
                .catch(error => {
                  if (error.name === 'AbortError') {
                    throw error;
                  }
                  console.error(`Failed to fetch AI face for field ${field.id} on ID ${index + 1}:`, error.message);
                  idInstanceData.photos[field.id] = null;
                })
            );
            break;
          default:
            console.warn(`Unknown field type: ${field.type}`);
        }
      }

      // Wait for all photo fetches to complete
      await Promise.all(photoPromises);

      // Check abort signal again
      if (signal.aborted) {
        throw new Error('Generation cancelled');
      }

      // Render the ID
      const { canvas, ctx } = canvasRenderer.createOffscreenCanvas(templateImage.width, templateImage.height);

      // Get the displayed canvas dimensions to calculate proper scale factors
      const displayCanvas = document.getElementById('idCanvas');
      let scaleFactors = { scaleX: 1, scaleY: 1 };
      
      if (displayCanvas) {
        // Field positions are relative to the displayed canvas size
        const displayRect = displayCanvas.getBoundingClientRect();
        scaleFactors = canvasRenderer.calculateScaleFactors(
          { width: displayRect.width, height: displayRect.height },
          { width: templateImage.width, height: templateImage.height }
        );
      }

      // Import appState to get font weight
      const { appState } = await import('./state.js');
      
      canvasRenderer.renderGeneratedId(
        ctx,
        templateImage,
        fields,
        idInstanceData.text,
        idInstanceData.photos,
        scaleFactors.scaleX,
        scaleFactors.scaleY,
        appState.fontWeight
      );

      // Convert to data URL
      const dataUrl = await canvasRenderer.canvasToDataURL(canvas);

      return {
        success: true,
        data: {
          name: `id_${index + 1}.png`,
          dataUrl,
          instanceData: idInstanceData,
          index
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Processes batch of promises with controlled concurrency
   * @private
   */
  async _processBatchWithConcurrency(promises, concurrent) {
    const results = [];
    const executing = [];

    for (let i = 0; i < promises.length; i++) {
      const promise = promises[i];
      results[i] = promise;

      if (promises.length >= concurrent) {
        executing.push(promise);

        if (executing.length >= concurrent) {
          await Promise.race(executing);
          executing.splice(executing.findIndex(p => p !== promise), 1);
        }
      }
    }

    return Promise.all(results);
  }

  /**
   * Converts blob to data URL
   * @private
   */
  _blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Loads an image from a data URL
   * @private
   */
  _loadImageFromDataURL(dataUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = dataUrl;
    });
  }

  /**
   * Emits progress events
   * @private
   */
  _emitProgress(eventName, detail) {
    this.dispatchEvent(new CustomEvent(eventName, {
      detail: {
        ...detail,
        timestamp: Date.now()
      }
    }));
  }
}

// Create and export singleton instance
export const idGenerator = new IDGenerator();
export default idGenerator;