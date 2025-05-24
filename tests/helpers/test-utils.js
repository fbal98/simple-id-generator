import { expect } from '@playwright/test';

/**
 * Test utilities for Simple ID Generator E2E tests
 */

export class TestUtils {
  constructor(page) {
    this.page = page;
  }

  /**
   * Upload a template image file
   */
  async uploadTemplate(filePath) {
    const fileInput = this.page.locator('#templateUpload');
    await fileInput.setInputFiles(filePath);
    
    // Wait for template to be loaded and displayed
    await expect(this.page.locator('#idCanvas')).toBeVisible();
    await this.page.waitForTimeout(1000); // Allow image to fully render
  }

  /**
   * Add a field of specific type
   */
  async addField(fieldType) {
    const buttonMap = {
      'name': '#addNameField',
      'dob': '#addDOBField', 
      'issueDate': '#addIssueDateField',
      'expiryDate': '#addExpiryDateField',
      'civilNo': '#addCivilNoField',
      'photo': '#addPhotoField'
    };
    
    const button = this.page.locator(buttonMap[fieldType]);
    await button.click();
    
    // Wait for field to appear in the overlay
    await this.page.waitForTimeout(500);
  }

  /**
   * Position a field by dragging to coordinates (relative to field layer)
   */
  async positionField(fieldSelector, x, y) {
    const field = this.page.locator(fieldSelector);
    const fieldLayer = this.page.locator('#fieldLayer');
    
    // First wait for the field to be visible
    await field.waitFor({ state: 'visible' });
    
    // Click to focus the field first
    await field.click();
    
    // Get bounding boxes
    const fieldBox = await field.boundingBox();
    const layerBox = await fieldLayer.boundingBox();
    
    if (!fieldBox || !layerBox) {
      throw new Error('Could not get bounding boxes for field or layer');
    }
    
    // Current position relative to field layer
    const currentX = fieldBox.x - layerBox.x;
    const currentY = fieldBox.y - layerBox.y;
    
    // Calculate absolute target position
    const targetAbsX = layerBox.x + x;
    const targetAbsY = layerBox.y + y;
    
    // Perform the drag by mouse operations
    await this.page.mouse.move(fieldBox.x + fieldBox.width / 2, fieldBox.y + fieldBox.height / 2);
    await this.page.mouse.down();
    await this.page.mouse.move(targetAbsX + fieldBox.width / 2, targetAbsY + fieldBox.height / 2, { steps: 5 });
    await this.page.mouse.up();
    
    // Wait a bit for the position to update
    await this.page.waitForTimeout(100);
  }

  /**
   * Get field selector by type (assumes only one field of each type for simplicity)
   */
  getFieldSelector(fieldType) {
    return `[id^="field-${fieldType}"]`;
  }

  /**
   * Resize a field by dragging resize handle
   */
  async resizeField(fieldSelector, deltaX, deltaY) {
    const field = this.page.locator(fieldSelector);
    await field.hover();
    
    const resizeHandle = field.locator('.resize-handle');
    const box = await resizeHandle.boundingBox();
    
    if (!box) {
      throw new Error('Resize handle not found');
    }
    
    // Perform drag operation manually
    await this.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await this.page.mouse.down();
    await this.page.mouse.move(box.x + box.width / 2 + deltaX, box.y + box.height / 2 + deltaY, { steps: 5 });
    await this.page.mouse.up();
    
    // Wait for resize to complete
    await this.page.waitForTimeout(100);
  }

  /**
   * Generate IDs with specified count
   */
  async generateIds(count = 1) {
    // Set count if more than 1
    if (count > 1) {
      await this.page.locator('#numIDsToGenerate').fill(count.toString());
    }
    
    // Click generate button
    await this.page.locator('#generateButton').click();
    
    // Wait for generation to complete
    await this.waitForGenerationComplete();
    
    // Wait a bit more for canvas to render
    await this.waitForCanvasRender();
  }

  /**
   * Mock the face API endpoint for consistent test results
   */
  async mockFaceApi() {
    await this.page.route('**/api/face', async route => {
      // Return a consistent test image
      const testImageBuffer = await this.page.request.get('/tests/fixtures/test-face.jpg');
      await route.fulfill({
        status: 200,
        contentType: 'image/jpeg',
        body: await testImageBuffer.body(),
      });
    });
  }

  /**
   * Wait for canvas to finish rendering
   */
  async waitForCanvasRender() {
    await this.page.waitForTimeout(1000);
  }

  /**
   * Check if ID generation is complete
   */
  async waitForGenerationComplete() {
    // Wait for progress wrapper to be hidden
    await this.page.waitForFunction(() => {
      const progress = document.querySelector('#progressWrapper');
      return !progress || progress.style.display === 'none' || !progress.style.display;
    }, { timeout: 30000 });
  }

  /**
   * Get the main canvas element for checking generated content
   */
  getMainCanvas() {
    return this.page.locator('#idCanvas');
  }

  /**
   * Check if canvas has image content (not just placeholder)
   */
  async canvasHasImageContent() {
    return await this.page.evaluate(() => {
      const canvas = document.getElementById('idCanvas');
      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Check if there's any non-transparent pixel
      for (let i = 3; i < imageData.data.length; i += 4) {
        if (imageData.data[i] > 0) { // Alpha channel
          return true;
        }
      }
      return false;
    });
  }

  /**
   * Get field position for validation
   */
  async getFieldPosition(fieldSelector) {
    const field = this.page.locator(fieldSelector);
    const fieldLayer = this.page.locator('#fieldLayer');
    
    const fieldBox = await field.boundingBox();
    const layerBox = await fieldLayer.boundingBox();
    
    if (!fieldBox || !layerBox) {
      throw new Error('Could not get bounding boxes for field or layer');
    }
    
    // Return position relative to the field layer
    return { 
      x: fieldBox.x - layerBox.x, 
      y: fieldBox.y - layerBox.y, 
      width: fieldBox.width, 
      height: fieldBox.height 
    };
  }

  /**
   * Download and verify file
   */
  async downloadFile(downloadSelector) {
    const downloadPromise = this.page.waitForDownload();
    await this.page.locator(downloadSelector).click();
    const download = await downloadPromise;
    
    return {
      filename: download.suggestedFilename(),
      path: await download.path(),
    };
  }

  /**
   * Get download buttons by their actual IDs
   */
  getDownloadPreviewBtn() {
    return this.page.locator('#downloadPreviewButton');
  }

  getDownloadAllBtn() {
    return this.page.locator('#downloadAllButton');
  }

  getEditLayoutBtn() {
    return this.page.locator('#editLayoutButton');
  }

  /**
   * Create a deterministic random seed for consistent test data
   */
  async setRandomSeed() {
    await this.page.addInitScript(() => {
      Math.random = () => 0.5; // Fixed seed for deterministic results
    });
  }
}

/**
 * Custom expect matchers for field positioning
 */
export function addCustomMatchers() {
  expect.extend({
    toBeWithinPixels(received, expected, tolerance = 5) {
      const pass = Math.abs(received - expected) <= tolerance;
      if (pass) {
        return {
          message: () => `expected ${received} not to be within ${tolerance}px of ${expected}`,
          pass: true,
        };
      } else {
        return {
          message: () => `expected ${received} to be within ${tolerance}px of ${expected}`,
          pass: false,
        };
      }
    },
  });
}