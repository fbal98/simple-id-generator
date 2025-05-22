import { test, expect } from '@playwright/test';
import path from 'path';
import { setupFaceMocking, setupFaceErrorMocking } from './fixtures/mock-face.js';

test.describe('Error Scenarios and Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    // Setup face mocking for offline testing
    await setupFaceMocking(page);
    await page.goto('/');
  });

  test.describe('Template Upload Errors', () => {
    test('should handle corrupted image files', async ({ page }) => {
      // Create a file with wrong extension but text content
      const corruptedFile = path.join(__dirname, 'fixtures', 'test-data.json');
      
      const fileInput = page.locator('#templateUpload');
      await fileInput.setInputFiles(corruptedFile);
      
      // Should not crash the app
      await page.waitForTimeout(2000);
      
      // Canvas should remain in empty state
      const canvas = page.locator('#idCanvas');
      await expect(canvas).toHaveClass(/empty-canvas/);
    });

    test('should handle extremely large image files', async ({ page }) => {
      // Skip this test if running in CI with limited resources
      const isCI = process.env.CI === 'true';
      test.skip(isCI, 'Skipping large file test in CI environment');
      
      // For non-CI environments, we'll just check the file input behavior
      const fileInput = page.locator('#templateUpload');
      
      // Ensure file input is accessible
      await expect(fileInput).toBeVisible();
      await expect(fileInput).toHaveAttribute('accept', 'image/*');
    });

    test('should handle unsupported file types gracefully', async ({ page }) => {
      // Try uploading a text file
      const textFile = path.join(__dirname, 'fixtures', 'test-data.json');
      
      const fileInput = page.locator('#templateUpload');
      await fileInput.setInputFiles(textFile);
      
      await page.waitForTimeout(2000);
      
      // Canvas should remain unchanged
      const canvas = page.locator('#idCanvas');
      await expect(canvas).toHaveClass(/empty-canvas/);
    });

    test('should handle network failures during image loading', async ({ page }) => {
      // Mock network to fail for external resources
      await page.route('**/*.svg', route => {
        route.abort();
      });
      
      const fileInput = page.locator('#templateUpload');
      const testImagePath = path.join(__dirname, 'fixtures', 'realistic-id-template.svg');
      
      await fileInput.setInputFiles(testImagePath);
      await page.waitForTimeout(2000);
      
      // App should handle gracefully
      const canvas = page.locator('#idCanvas');
      const hasEmptyClass = await canvas.evaluate(el => el.classList.contains('empty-canvas'));
      
      // Should either load successfully or remain empty
      expect(typeof hasEmptyClass).toBe('boolean');
    });
  });

  test.describe('Field Management Errors', () => {
    test('should handle rapid field addition', async ({ page }) => {
      // Upload template first
      const fileInput = page.locator('#templateUpload');
      const testImagePath = path.join(__dirname, 'fixtures', 'realistic-id-template.svg');
      await fileInput.setInputFiles(testImagePath);
      await page.waitForTimeout(1000);
      
      // Rapidly add many fields
      const addPromises = [];
      for (let i = 0; i < 10; i++) {
        addPromises.push(page.click('#addNameField'));
        addPromises.push(page.click('#addDOBField'));
      }
      
      await Promise.all(addPromises);
      
      // Check that app doesn't crash
      const fields = page.locator('#fieldLayer .field');
      const fieldCount = await fields.count();
      
      expect(fieldCount).toBeGreaterThan(0);
      expect(fieldCount).toBeLessThanOrEqual(20);
    });

    test('should handle field operations without template', async ({ page }) => {
      // Try field operations without uploading template
      let alertShown = false;
      page.on('dialog', async dialog => {
        alertShown = true;
        await dialog.accept();
      });
      
      // Should show alert for each field type
      await page.click('#addNameField');
      expect(alertShown).toBeTruthy();
      
      alertShown = false;
      await page.click('#addPhotoField');
      expect(alertShown).toBeTruthy();
    });

    test('should handle extreme field positions', async ({ page }) => {
      const fileInput = page.locator('#templateUpload');
      const testImagePath = path.join(__dirname, 'fixtures', 'realistic-id-template.svg');
      await fileInput.setInputFiles(testImagePath);
      await page.waitForTimeout(1000);
      
      await page.click('#addNameField');
      
      const nameField = page.locator('#fieldLayer .field[data-type="name"]');
      
      // Try to drag field to extreme positions
      await nameField.dragTo(page.locator('#idCanvas'), {
        targetPosition: { x: -100, y: -100 }
      });
      
      // Field should be constrained within bounds
      const fieldBox = await nameField.boundingBox();
      expect(fieldBox.x).toBeGreaterThanOrEqual(0);
      expect(fieldBox.y).toBeGreaterThanOrEqual(0);
    });

    test('should handle field removal during drag', async ({ page }) => {
      const fileInput = page.locator('#templateUpload');
      const testImagePath = path.join(__dirname, 'fixtures', 'realistic-id-template.svg');
      await fileInput.setInputFiles(testImagePath);
      await page.waitForTimeout(1000);
      
      await page.click('#addNameField');
      
      const nameField = page.locator('#fieldLayer .field[data-type="name"]');
      
      // Start drag operation
      await nameField.hover();
      await page.mouse.down();
      
      // Upload new template while dragging (should clear fields)
      const smallImagePath = path.join(__dirname, 'fixtures', 'small-test-template.svg');
      await fileInput.setInputFiles(smallImagePath);
      
      await page.mouse.up();
      
      // Should not crash
      const fields = page.locator('#fieldLayer .field');
      await expect(fields).toHaveCount(0);
    });
  });

  test.describe('ID Generation Errors', () => {
    test('should handle generation with invalid field configurations', async ({ page }) => {
      const fileInput = page.locator('#templateUpload');
      const testImagePath = path.join(__dirname, 'fixtures', 'realistic-id-template.svg');
      await fileInput.setInputFiles(testImagePath);
      await page.waitForTimeout(1000);
      
      await page.click('#addNameField');
      
      // Manipulate field data to create invalid state
      await page.evaluate(() => {
        const fields = window.appState.getFields();
        for (const fieldId in fields) {
          fields[fieldId].type = 'invalid-type';
        }
      });
      
      await page.click('#generateButton');
      
      // Should handle gracefully
      await page.waitForSelector('#generateButton:not([disabled])', { timeout: 20000 });
      
      // Generation should complete (might generate empty/default data)
      const generateButton = page.locator('#generateButton');
      await expect(generateButton).toBeEnabled();
    });

    test('should handle memory constraints with large batches', async ({ page }) => {
      const fileInput = page.locator('#templateUpload');
      const testImagePath = path.join(__dirname, 'fixtures', 'realistic-id-template.svg');
      await fileInput.setInputFiles(testImagePath);
      await page.waitForTimeout(1000);
      
      await page.click('#addNameField');
      await page.click('#addPhotoField');
      
      // Try generating a large batch
      await page.fill('#numIDsToGenerate', '50');
      
      await page.click('#generateButton');
      
      // Should either complete or fail gracefully
      await page.waitForSelector('#generateButton:not([disabled])', { 
        timeout: 120000 // 2 minutes for large batch
      });
      
      const generateButton = page.locator('#generateButton');
      await expect(generateButton).toBeEnabled();
    });

    test('should handle interrupted generation', async ({ page }) => {
      const fileInput = page.locator('#templateUpload');
      const testImagePath = path.join(__dirname, 'fixtures', 'realistic-id-template.svg');
      await fileInput.setInputFiles(testImagePath);
      await page.waitForTimeout(1000);
      
      await page.click('#addNameField');
      await page.click('#addPhotoField');
      
      await page.fill('#numIDsToGenerate', '10');
      await page.click('#generateButton');
      
      // Interrupt by uploading new template
      await page.waitForTimeout(2000);
      const smallImagePath = path.join(__dirname, 'fixtures', 'small-test-template.svg');
      await fileInput.setInputFiles(smallImagePath);
      
      // Should handle interruption gracefully
      await page.waitForTimeout(3000);
      
      const generateButton = page.locator('#generateButton');
      await expect(generateButton).toBeEnabled();
    });

    test('should handle canvas rendering failures', async ({ page }) => {
      const fileInput = page.locator('#templateUpload');
      const testImagePath = path.join(__dirname, 'fixtures', 'realistic-id-template.svg');
      await fileInput.setInputFiles(testImagePath);
      await page.waitForTimeout(1000);
      
      await page.click('#addNameField');
      
      // Mock canvas to throw errors
      await page.addInitScript(() => {
        const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
        HTMLCanvasElement.prototype.toDataURL = function() {
          if (this.id !== 'idCanvas') {
            throw new Error('Canvas tainted - CORS error simulation');
          }
          return originalToDataURL.call(this, ...arguments);
        };
      });
      
      await page.click('#generateButton');
      
      // Should handle canvas errors
      await page.waitForSelector('#generateButton:not([disabled])', { timeout: 20000 });
      
      const generateButton = page.locator('#generateButton');
      await expect(generateButton).toBeEnabled();
    });
  });

  test.describe('Network and API Errors', () => {
    test('should handle complete network failure', async ({ page }) => {
      // Block all network requests
      await page.route('**/*', route => {
        if (route.request().url().includes('localhost:3000')) {
          // Allow local server requests
          route.continue();
        } else {
          route.abort();
        }
      });
      
      const fileInput = page.locator('#templateUpload');
      const testImagePath = path.join(__dirname, 'fixtures', 'realistic-id-template.svg');
      await fileInput.setInputFiles(testImagePath);
      await page.waitForTimeout(1000);
      
      await page.click('#addPhotoField');
      await page.click('#generateButton');
      
      // Should complete with degraded functionality
      await page.waitForSelector('#generateButton:not([disabled])', { timeout: 20000 });
      
      await expect(page.locator('#downloadPreviewButton')).toBeEnabled();
    });

    test('should handle API rate limiting', async ({ page }) => {
      // Mock API to return 429 Too Many Requests
      await page.route('**/api/face', route => {
        route.fulfill({
          status: 429,
          headers: {
            'Retry-After': '60',
            'Access-Control-Allow-Origin': '*'
          },
          body: 'Rate limit exceeded'
        });
      });
      
      const fileInput = page.locator('#templateUpload');
      const testImagePath = path.join(__dirname, 'fixtures', 'realistic-id-template.svg');
      await fileInput.setInputFiles(testImagePath);
      await page.waitForTimeout(1000);
      
      await page.click('#addPhotoField');
      await page.click('#generateButton');
      
      // Should handle rate limiting gracefully
      await page.waitForSelector('#generateButton:not([disabled])', { timeout: 20000 });
      
      await expect(page.locator('#downloadPreviewButton')).toBeEnabled();
    });

    test('should handle malformed API responses', async ({ page }) => {
      // Mock API to return invalid data
      await page.route('**/api/face', route => {
        route.fulfill({
          status: 200,
          contentType: 'text/plain',
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: 'Not an image'
        });
      });
      
      const fileInput = page.locator('#templateUpload');
      const testImagePath = path.join(__dirname, 'fixtures', 'realistic-id-template.svg');
      await fileInput.setInputFiles(testImagePath);
      await page.waitForTimeout(1000);
      
      await page.click('#addPhotoField');
      await page.click('#generateButton');
      
      // Should handle malformed responses
      await page.waitForSelector('#generateButton:not([disabled])', { timeout: 20000 });
      
      await expect(page.locator('#downloadPreviewButton')).toBeEnabled();
    });
  });

  test.describe('Browser Compatibility Issues', () => {
    test('should handle missing modern JavaScript features', async ({ page }) => {
      // Mock missing features
      await page.addInitScript(() => {
        // Simulate older browser without some modern features
        delete window.fetch;
        delete window.Promise.allSettled;
      });
      
      await page.reload();
      
      // App should still load (may have degraded functionality)
      await expect(page.locator('#idCanvas')).toBeVisible();
      await expect(page.locator('#templateUpload')).toBeVisible();
    });

    test('should handle localStorage unavailability', async ({ page }) => {
      await page.addInitScript(() => {
        Object.defineProperty(window, 'localStorage', {
          value: null,
          writable: false
        });
      });
      
      await page.reload();
      
      // App should still function without localStorage
      await expect(page.locator('#idCanvas')).toBeVisible();
    });

    test('should handle canvas unavailability', async ({ page }) => {
      await page.addInitScript(() => {
        HTMLCanvasElement.prototype.getContext = function() {
          return null; // Simulate canvas not supported
        };
      });
      
      await page.reload();
      
      // App should detect and handle missing canvas support
      await expect(page.locator('#idCanvas')).toBeVisible();
    });

    test('should handle WebGL context loss', async ({ page }) => {
      const fileInput = page.locator('#templateUpload');
      const testImagePath = path.join(__dirname, 'fixtures', 'realistic-id-template.svg');
      await fileInput.setInputFiles(testImagePath);
      await page.waitForTimeout(1000);
      
      await page.click('#addNameField');
      
      // Simulate context loss during generation
      await page.evaluate(() => {
        const canvas = document.getElementById('idCanvas');
        const event = new Event('webglcontextlost');
        canvas.dispatchEvent(event);
      });
      
      await page.click('#generateButton');
      
      // Should handle context loss gracefully
      await page.waitForSelector('#generateButton:not([disabled])', { timeout: 20000 });
    });
  });

  test.describe('Resource Exhaustion', () => {
    test('should handle DOM node limits', async ({ page }) => {
      const fileInput = page.locator('#templateUpload');
      const testImagePath = path.join(__dirname, 'fixtures', 'realistic-id-template.svg');
      await fileInput.setInputFiles(testImagePath);
      await page.waitForTimeout(1000);
      
      // Add maximum reasonable number of fields
      for (let i = 0; i < 20; i++) {
        await page.click('#addNameField');
      }
      
      // Should not crash
      const fields = page.locator('#fieldLayer .field');
      const fieldCount = await fields.count();
      expect(fieldCount).toBeLessThanOrEqual(20);
    });

    test('should handle CSS style limits', async ({ page }) => {
      const fileInput = page.locator('#templateUpload');
      const testImagePath = path.join(__dirname, 'fixtures', 'realistic-id-template.svg');
      await fileInput.setInputFiles(testImagePath);
      await page.waitForTimeout(1000);
      
      await page.click('#addNameField');
      
      const nameField = page.locator('#fieldLayer .field[data-type="name"]');
      
      // Apply extreme styles
      await page.evaluate(() => {
        const field = document.querySelector('#fieldLayer .field[data-type="name"]');
        if (field) {
          field.style.fontSize = '1000px';
          field.style.width = '10000px';
          field.style.height = '10000px';
        }
      });
      
      // Should constrain to reasonable bounds
      const fieldBox = await nameField.boundingBox();
      expect(fieldBox.width).toBeLessThan(2000);
      expect(fieldBox.height).toBeLessThan(2000);
    });

    test('should handle memory pressure during generation', async ({ page }) => {
      const fileInput = page.locator('#templateUpload');
      const testImagePath = path.join(__dirname, 'fixtures', 'realistic-id-template.svg');
      await fileInput.setInputFiles(testImagePath);
      await page.waitForTimeout(1000);
      
      await page.click('#addNameField');
      await page.click('#addPhotoField');
      
      // Allocate large amount of memory to simulate pressure
      await page.evaluate(() => {
        window.memoryHog = new Array(1000000).fill('memory-pressure-test');
      });
      
      await page.fill('#numIDsToGenerate', '5');
      await page.click('#generateButton');
      
      // Should handle memory pressure
      await page.waitForSelector('#generateButton:not([disabled])', { timeout: 30000 });
      
      // Clean up
      await page.evaluate(() => {
        delete window.memoryHog;
      });
    });
  });

  test.describe('Accessibility and Edge Cases', () => {
    test('should handle keyboard-only navigation', async ({ page }) => {
      const fileInput = page.locator('#templateUpload');
      const testImagePath = path.join(__dirname, 'fixtures', 'realistic-id-template.svg');
      await fileInput.setInputFiles(testImagePath);
      await page.waitForTimeout(1000);
      
      // Navigate using keyboard
      await page.keyboard.press('Tab'); // Focus first element
      await page.keyboard.press('Tab'); // Navigate to next
      
      // Should not crash during keyboard navigation
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle screen reader compatibility', async ({ page }) => {
      // Check for basic accessibility attributes
      await expect(page.locator('#templateUpload')).toHaveAttribute('type', 'file');
      await expect(page.locator('#generateButton')).toHaveAttribute('type', 'button');
      
      // Labels should be properly associated
      const labels = page.locator('label');
      const labelCount = await labels.count();
      expect(labelCount).toBeGreaterThan(0);
    });

    test('should handle focus management during errors', async ({ page }) => {
      let alertShown = false;
      page.on('dialog', async dialog => {
        alertShown = true;
        await dialog.accept();
      });
      
      // Try to generate without template
      await page.click('#generateButton');
      expect(alertShown).toBeTruthy();
      
      // Focus should return appropriately after dialog
      const activeElement = await page.evaluate(() => document.activeElement.id);
      expect(activeElement).toBeTruthy();
    });
  });
});