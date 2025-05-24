// Canvas rendering module for Simple ID Generator
// Handles all canvas drawing operations without state mutations

import { CONFIG } from './config.js';

export class CanvasRenderer {
  constructor() {
    this.defaultFont = CONFIG.CANVAS.PLACEHOLDER_FONT;
    this.backgroundColor = CONFIG.CANVAS.BACKGROUND_COLOR;
    this.placeholderText = CONFIG.CANVAS.PLACEHOLDER_TEXT;
  }

  /**
   * Renders the template image or placeholder to the main canvas
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {HTMLImageElement|null} templateImage - Template image to render
   * @param {HTMLCanvasElement} canvas - Canvas element for dimensions
   */
  renderTemplate(ctx, templateImage, canvas) {
    if (!ctx || !canvas) {
      throw new Error('Canvas context and canvas element are required');
    }

    console.log('Rendering template:', { hasTemplate: !!templateImage, canvasSize: { width: canvas.width, height: canvas.height }});

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (templateImage) {
      // Render the template image
      ctx.drawImage(templateImage, 0, 0, canvas.width, canvas.height);
      canvas.classList.remove('empty-canvas');
    } else {
      // Render placeholder
      console.log('Rendering placeholder...');
      this._renderPlaceholder(ctx, canvas);
      canvas.classList.add('empty-canvas');
    }
  }

  /**
   * Renders a complete ID with all fields and data to a target context
   * @param {CanvasRenderingContext2D} targetCtx - Target canvas context
   * @param {HTMLImageElement} baseTemplate - Base template image
   * @param {Map|Object} fieldLayouts - Field configurations
   * @param {Object} textDataById - Text data for each field ID
   * @param {Object} photoDataById - Photo image objects for each photo field ID
   * @param {number} scaleX - Horizontal scale factor
   * @param {number} scaleY - Vertical scale factor
   */
  renderGeneratedId(targetCtx, baseTemplate, fieldLayouts, textDataById, photoDataById, scaleX = 1, scaleY = 1) {
    if (!targetCtx) {
      throw new Error('Target canvas context is required');
    }

    // Clear and draw base template
    targetCtx.clearRect(0, 0, targetCtx.canvas.width, targetCtx.canvas.height);
    if (baseTemplate) {
      targetCtx.drawImage(baseTemplate, 0, 0, targetCtx.canvas.width, targetCtx.canvas.height);
    }

    // Set default text rendering properties
    targetCtx.fillStyle = 'black';
    targetCtx.textAlign = 'left';
    targetCtx.textBaseline = 'top';

    // Convert Map to Object if necessary for iteration
    const fieldsToRender = fieldLayouts instanceof Map ? 
      Object.fromEntries(fieldLayouts) : fieldLayouts;

    // Render each field
    for (const [fieldId, field] of Object.entries(fieldsToRender)) {
      this._renderField(targetCtx, field, textDataById, photoDataById, scaleX, scaleY);
    }
  }

  /**
   * Creates an offscreen canvas for rendering
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   * @returns {Object} Object with canvas and context
   */
  createOffscreenCanvas(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    return { canvas, ctx };
  }

  /**
   * Converts a canvas to a data URL
   * @param {HTMLCanvasElement} canvas - Canvas to convert
   * @param {string} format - Image format (default: PNG)
   * @param {number} quality - Image quality for JPEG (0-1)
   * @returns {Promise<string>} Data URL
   */
  async canvasToDataURL(canvas, format = CONFIG.FILES.EXPORT_FORMATS.PNG, quality = 0.92) {
    return new Promise((resolve, reject) => {
      try {
        const dataUrl = canvas.toDataURL(format, quality);
        resolve(dataUrl);
      } catch (error) {
        // Handle CORS tainted canvas
        if (error.name === 'SecurityError') {
          reject(new Error('Canvas is tainted by cross-origin data and cannot be exported'));
        } else {
          reject(error);
        }
      }
    });
  }

  /**
   * Sets canvas dimensions and clears it
   * @param {HTMLCanvasElement} canvas - Canvas element
   * @param {number} width - New width
   * @param {number} height - New height
   */
  setCanvasDimensions(canvas, width, height) {
    if (!canvas) {
      throw new Error('Canvas element is required');
    }

    canvas.width = width;
    canvas.height = height;
    
    // Clear the canvas after resizing
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, width, height);
    }
  }

  /**
   * Calculates scale factors between two dimensions
   * @param {Object} source - Source dimensions {width, height}
   * @param {Object} target - Target dimensions {width, height}
   * @returns {Object} Scale factors {scaleX, scaleY}
   */
  calculateScaleFactors(source, target) {
    return {
      scaleX: source.width !== 0 ? target.width / source.width : 1,
      scaleY: source.height !== 0 ? target.height / source.height : 1
    };
  }

  /**
   * Clears a canvas context
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  clearCanvas(ctx) {
    if (!ctx) return;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }

  // Private helper methods

  /**
   * Renders placeholder text when no template is loaded
   * @private
   */
  _renderPlaceholder(ctx, canvas) {
    // Background
    ctx.fillStyle = this.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Placeholder text
    ctx.fillStyle = '#555';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = this.defaultFont;
    ctx.fillText(this.placeholderText, canvas.width / 2, canvas.height / 2);

    // Reset text properties
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
  }

  /**
   * Renders a single field to the canvas
   * @private
   */
  _renderField(ctx, field, textDataById, photoDataById, scaleX, scaleY) {
    const x = field.x * scaleX;
    const y = field.y * scaleY;
    const width = field.width * scaleX;
    const height = field.height * scaleY;

    if (field.type === CONFIG.FIELDS.TYPES.PHOTO) {
      this._renderPhotoField(ctx, field, photoDataById, x, y, width, height);
    } else {
      this._renderTextField(ctx, field, textDataById, x, y, width, height, scaleX, scaleY);
    }
  }

  /**
   * Renders a photo field
   * @private
   */
  _renderPhotoField(ctx, field, photoDataById, x, y, width, height) {
    const photoImageObj = photoDataById[field.id];
    
    if (photoImageObj) {
      try {
        ctx.drawImage(photoImageObj, x, y, width, height);
      } catch (error) {
        console.error(`Error drawing photo for field ${field.id}:`, error);
        this._renderPhotoError(ctx, x, y, width, height, 'Photo Error');
      }
    } else {
      this._renderPhotoError(ctx, x, y, width, height, 'No Photo Data', true);
    }
  }

  /**
   * Renders a text field
   * @private
   */
  _renderTextField(ctx, field, textDataById, x, y, width, height, scaleX, scaleY) {
    const textToDraw = textDataById[field.id] || `[${field.type}]`;
    const scaledFontSize = (field.fontSize || CONFIG.FIELDS.DEFAULT_FONT_SIZE) * scaleY;
    const labelEdge = field.labelEdge || 'left';
    
    // Set font
    ctx.font = `${scaledFontSize}px ${field.fontFamily || CONFIG.FIELDS.DEFAULT_FONT_FAMILY}`;
    
    // Calculate padding
    const paddingX = 2 * scaleX;
    const paddingY = 2 * scaleY;
    
    // Measure text for alignment
    const textMetrics = ctx.measureText(String(textToDraw).trim());
    const textWidth = textMetrics.width;
    
    // Save context state
    ctx.save();
    
    // Set fill style
    ctx.fillStyle = 'black';
    
    // Calculate text position based on label edge
    let textX = x + paddingX;
    let textY = y + paddingY;
    
    switch (labelEdge) {
      case 'right':
        // Align text to the right edge
        textX = x + width - paddingX - textWidth;
        break;
      case 'top':
        // Center text horizontally, align to top
        textX = x + (width - textWidth) / 2;
        textY = y + paddingY * 6; // Extra padding for top label
        break;
      case 'bottom':
        // Center text horizontally, align to bottom
        textX = x + (width - textWidth) / 2;
        textY = y + height - paddingY * 6 - scaledFontSize; // Account for font height
        break;
      // 'left' is default, no adjustment needed
    }
    
    // Render text (single line, no wrapping)
    ctx.fillText(String(textToDraw).trim(), textX, textY);
    
    // Restore context state
    ctx.restore();
  }

  /**
   * Renders photo error state
   * @private
   */
  _renderPhotoError(ctx, x, y, width, height, message, isOutline = false) {
    // Save current context state
    const originalFillStyle = ctx.fillStyle;
    const originalStrokeStyle = ctx.strokeStyle;
    const originalTextAlign = ctx.textAlign;
    const originalTextBaseline = ctx.textBaseline;
    const originalLineWidth = ctx.lineWidth;

    if (isOutline) {
      // Draw red outline for missing photo
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, width, height);
      ctx.fillStyle = 'red';
    } else {
      // Fill with semi-transparent red for photo error
      ctx.fillStyle = 'rgba(255,0,0,0.5)';
      ctx.fillRect(x, y, width, height);
      ctx.fillStyle = 'white';
    }

    // Center the error message
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(message, x + width / 2, y + height / 2);

    // Restore context state
    ctx.fillStyle = originalFillStyle;
    ctx.strokeStyle = originalStrokeStyle;
    ctx.textAlign = originalTextAlign;
    ctx.textBaseline = originalTextBaseline;
    ctx.lineWidth = originalLineWidth;
  }
}

// Create and export singleton instance
export const canvasRenderer = new CanvasRenderer();
export default canvasRenderer;