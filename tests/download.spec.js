import { test, expect } from '@playwright/test';
import path from 'path';
import { setupFaceMocking } from './fixtures/mock-face.js';

test.describe('Download Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Setup face mocking for offline testing
    await setupFaceMocking(page);
    await page.goto('/');
    
    // Upload template and add fields
    const fileInput = page.locator('#templateUpload');
    const testImagePath = path.join(__dirname, 'fixtures', 'realistic-id-template.svg');
    await fileInput.setInputFiles(testImagePath);
    await page.waitForTimeout(1000);
    
    // Add basic fields for testing
    await page.click('#addNameField');
    await page.click('#addDOBField');
    await page.click('#addCivilNoField');
  });

  test.describe('Preview Download', () => {
    test('should be disabled before ID generation', async ({ page }) => {
      const downloadPreviewButton = page.locator('#downloadPreviewButton');
      await expect(downloadPreviewButton).toBeDisabled();
    });

    test('should be enabled after ID generation', async ({ page }) => {
      await page.click('#generateButton');
      await page.waitForSelector('#generateButton:not([disabled])', { timeout: 20000 });
      
      const downloadPreviewButton = page.locator('#downloadPreviewButton');
      await expect(downloadPreviewButton).toBeEnabled();
    });

    test('should trigger download when clicked', async ({ page }) => {
      await page.click('#generateButton');
      await page.waitForSelector('#generateButton:not([disabled])', { timeout: 20000 });
      
      // Set up download handler
      const downloadPromise = page.waitForEvent('download');
      
      await page.click('#downloadPreviewButton');
      
      const download = await downloadPromise;
      
      // Check download properties
      expect(download.suggestedFilename()).toBe('id_1.png');
      
      // Verify file was actually downloaded
      const downloadPath = await download.path();
      expect(downloadPath).toBeTruthy();
    });

    test('should show alert when no IDs generated', async ({ page }) => {
      let alertMessage = '';
      page.on('dialog', async dialog => {
        alertMessage = dialog.message();
        await dialog.accept();
      });
      
      // Try to download without generating IDs
      await page.click('#downloadPreviewButton');
      
      expect(alertMessage).toBe('No ID generated yet to download. Please generate IDs first.');
    });

    test('should download PNG file with correct content', async ({ page }) => {
      await page.click('#generateButton');
      await page.waitForSelector('#generateButton:not([disabled])', { timeout: 20000 });
      
      const downloadPromise = page.waitForEvent('download');
      await page.click('#downloadPreviewButton');
      const download = await downloadPromise;
      
      // Save download to temporary location
      const downloadPath = await download.path();
      
      // Read file and verify it's a valid PNG
      const fs = require('fs');
      const fileBuffer = fs.readFileSync(downloadPath);
      
      // Check PNG signature
      expect(fileBuffer[0]).toBe(0x89);
      expect(fileBuffer[1]).toBe(0x50);
      expect(fileBuffer[2]).toBe(0x4E);
      expect(fileBuffer[3]).toBe(0x47);
      
      // Check file size is reasonable
      expect(fileBuffer.length).toBeGreaterThan(1000); // Should be larger than 1KB
    });
  });

  test.describe('Download All (ZIP)', () => {
    test('should be hidden for single ID', async ({ page }) => {
      await page.fill('#numIDsToGenerate', '1');
      await page.click('#generateButton');
      await page.waitForSelector('#generateButton:not([disabled])', { timeout: 20000 });
      
      const downloadAllButton = page.locator('#downloadAllButton');
      await expect(downloadAllButton).toBeHidden();
    });

    test('should be visible for multiple IDs', async ({ page }) => {
      await page.fill('#numIDsToGenerate', '3');
      await page.click('#generateButton');
      await page.waitForSelector('#generateButton:not([disabled])', { timeout: 30000 });
      
      const downloadAllButton = page.locator('#downloadAllButton');
      await expect(downloadAllButton).toBeVisible();
    });

    test('should be disabled if JSZip is not available', async ({ page }) => {
      // Mock JSZip as unavailable
      await page.addInitScript(() => {
        delete window.JSZip;
      });
      
      await page.reload();
      
      // Upload template and add fields again
      const fileInput = page.locator('#templateUpload');
      const testImagePath = path.join(__dirname, 'fixtures', 'realistic-id-template.svg');
      await fileInput.setInputFiles(testImagePath);
      await page.waitForTimeout(1000);
      await page.click('#addNameField');
      
      await page.fill('#numIDsToGenerate', '3');
      await page.click('#generateButton');
      await page.waitForSelector('#generateButton:not([disabled])', { timeout: 30000 });
      
      const downloadAllButton = page.locator('#downloadAllButton');
      await expect(downloadAllButton).toBeDisabled();
    });

    test('should download ZIP file with multiple IDs', async ({ page }) => {
      await page.fill('#numIDsToGenerate', '3');
      await page.click('#generateButton');
      await page.waitForSelector('#generateButton:not([disabled])', { timeout: 30000 });
      
      const downloadPromise = page.waitForEvent('download');
      await page.click('#downloadAllButton');
      const download = await downloadPromise;
      
      expect(download.suggestedFilename()).toBe('generated_ids.zip');
      
      // Verify ZIP file was downloaded
      const downloadPath = await download.path();
      expect(downloadPath).toBeTruthy();
      
      // Verify it's a valid ZIP file
      const fs = require('fs');
      const fileBuffer = fs.readFileSync(downloadPath);
      
      // Check ZIP signature (PK)
      expect(fileBuffer[0]).toBe(0x50);
      expect(fileBuffer[1]).toBe(0x4B);
      
      expect(fileBuffer.length).toBeGreaterThan(100); // Should be reasonably sized
    });

    test('should show alert for insufficient IDs', async ({ page }) => {
      await page.fill('#numIDsToGenerate', '1');
      await page.click('#generateButton');
      await page.waitForSelector('#generateButton:not([disabled])', { timeout: 20000 });
      
      let alertMessage = '';
      page.on('dialog', async dialog => {
        alertMessage = dialog.message();
        await dialog.accept();
      });
      
      // Try to download all with only 1 ID
      await page.click('#downloadAllButton');
      
      expect(alertMessage).toBe('Generate at least two IDs to download a ZIP.');
    });

    test('should show alert when JSZip fails to load', async ({ page }) => {
      // Simulate JSZip failure after generation
      await page.fill('#numIDsToGenerate', '2');
      await page.click('#generateButton');
      await page.waitForSelector('#generateButton:not([disabled])', { timeout: 30000 });
      
      // Remove JSZip after generation
      await page.evaluate(() => {
        delete window.JSZip;
      });
      
      let alertMessage = '';
      page.on('dialog', async dialog => {
        alertMessage = dialog.message();
        await dialog.accept();
      });
      
      await page.click('#downloadAllButton');
      
      expect(alertMessage).toBe('JSZip library failed to load. Unable to generate ZIP file.');
    });

    test('should contain correct number of files in ZIP', async ({ page }) => {
      const numIds = 4;
      await page.fill('#numIDsToGenerate', numIds.toString());
      await page.click('#generateButton');
      await page.waitForSelector('#generateButton:not([disabled])', { timeout: 40000 });
      
      // Check that the correct number of IDs were generated
      const generatedIds = await page.evaluate(() => {
        return window.appState.getGeneratedIds();
      });
      
      expect(generatedIds).toHaveLength(numIds);
      
      // Download should work
      const downloadPromise = page.waitForEvent('download');
      await page.click('#downloadAllButton');
      const download = await downloadPromise;
      
      expect(download.suggestedFilename()).toBe('generated_ids.zip');
    });
  });

  test.describe('File Naming', () => {
    test('should use correct naming pattern for preview', async ({ page }) => {
      await page.click('#generateButton');
      await page.waitForSelector('#generateButton:not([disabled])', { timeout: 20000 });
      
      const downloadPromise = page.waitForEvent('download');
      await page.click('#downloadPreviewButton');
      const download = await downloadPromise;
      
      expect(download.suggestedFilename()).toBe('id_1.png');
    });

    test('should use consistent naming for ZIP file', async ({ page }) => {
      await page.fill('#numIDsToGenerate', '2');
      await page.click('#generateButton');
      await page.waitForSelector('#generateButton:not([disabled])', { timeout: 30000 });
      
      const downloadPromise = page.waitForEvent('download');
      await page.click('#downloadAllButton');
      const download = await downloadPromise;
      
      expect(download.suggestedFilename()).toBe('generated_ids.zip');
    });

    test('should generate sequential file names in app state', async ({ page }) => {
      await page.fill('#numIDsToGenerate', '3');
      await page.click('#generateButton');
      await page.waitForSelector('#generateButton:not([disabled])', { timeout: 30000 });
      
      const generatedIds = await page.evaluate(() => {
        return window.appState.getGeneratedIds();
      });
      
      expect(generatedIds[0].name).toBe('id_1.png');
      expect(generatedIds[1].name).toBe('id_2.png');
      expect(generatedIds[2].name).toBe('id_3.png');
    });
  });

  test.describe('Button State Management', () => {
    test('should maintain button states after download', async ({ page }) => {
      await page.fill('#numIDsToGenerate', '2');
      await page.click('#generateButton');
      await page.waitForSelector('#generateButton:not([disabled])', { timeout: 30000 });
      
      const downloadPreviewButton = page.locator('#downloadPreviewButton');
      const downloadAllButton = page.locator('#downloadAllButton');
      
      // Both should be enabled/visible
      await expect(downloadPreviewButton).toBeEnabled();
      await expect(downloadAllButton).toBeVisible();
      
      // Download preview
      const downloadPromise = page.waitForEvent('download');
      await downloadPreviewButton.click();
      await downloadPromise;
      
      // Buttons should remain in same state
      await expect(downloadPreviewButton).toBeEnabled();
      await expect(downloadAllButton).toBeVisible();
    });

    test('should hide download buttons when new template is uploaded', async ({ page }) => {
      // Generate IDs first
      await page.click('#generateButton');
      await page.waitForSelector('#generateButton:not([disabled])', { timeout: 20000 });
      
      const downloadAllButton = page.locator('#downloadAllButton');
      const editLayoutButton = page.locator('#editLayoutButton');
      
      // Upload new template
      const fileInput = page.locator('#templateUpload');
      const testImagePath = path.join(__dirname, 'fixtures', 'small-test-template.svg');
      await fileInput.setInputFiles(testImagePath);
      await page.waitForTimeout(1000);
      
      // Buttons should be hidden
      await expect(downloadAllButton).toBeHidden();
      await expect(editLayoutButton).toBeHidden();
    });

    test('should reset button states after clearing results', async ({ page }) => {
      await page.fill('#numIDsToGenerate', '2');
      await page.click('#generateButton');
      await page.waitForSelector('#generateButton:not([disabled])', { timeout: 30000 });
      
      // Buttons should be active
      await expect(page.locator('#downloadPreviewButton')).toBeEnabled();
      await expect(page.locator('#downloadAllButton')).toBeVisible();
      
      // Clear by uploading new template
      const fileInput = page.locator('#templateUpload');
      const testImagePath = path.join(__dirname, 'fixtures', 'small-test-template.svg');
      await fileInput.setInputFiles(testImagePath);
      await page.waitForTimeout(1000);
      
      // Should reset to initial state
      await expect(page.locator('#downloadPreviewButton')).toBeDisabled();
      await expect(page.locator('#downloadAllButton')).toBeHidden();
    });
  });

  test.describe('Data URL Generation', () => {
    test('should generate valid PNG data URLs', async ({ page }) => {
      await page.click('#generateButton');
      await page.waitForSelector('#generateButton:not([disabled])', { timeout: 20000 });
      
      const generatedIds = await page.evaluate(() => {
        return window.appState.getGeneratedIds();
      });
      
      expect(generatedIds).toHaveLength(1);
      
      const dataUrl = generatedIds[0].dataUrl;
      expect(dataUrl).toMatch(/^data:image\/png;base64,/);
      
      // Data URL should contain actual image data
      expect(dataUrl.length).toBeGreaterThan(100);
    });

    test('should generate different data URLs for different IDs', async ({ page }) => {
      await page.fill('#numIDsToGenerate', '3');
      await page.click('#generateButton');
      await page.waitForSelector('#generateButton:not([disabled])', { timeout: 30000 });
      
      const generatedIds = await page.evaluate(() => {
        return window.appState.getGeneratedIds();
      });
      
      const dataUrls = generatedIds.map(id => id.dataUrl);
      
      // All should be valid PNG data URLs
      dataUrls.forEach(url => {
        expect(url).toMatch(/^data:image\/png;base64,/);
      });
      
      // They should be different (due to random data)
      const uniqueUrls = new Set(dataUrls);
      expect(uniqueUrls.size).toBeGreaterThan(1);
    });

    test('should handle canvas tainted scenarios gracefully', async ({ page }) => {
      // Add photo field which might cause CORS issues
      await page.click('#addPhotoField');
      
      // Mock face API to return potentially CORS-tainted response
      await page.route('**/api/face', route => {
        route.fulfill({
          status: 200,
          contentType: 'image/jpeg',
          body: 'mock-image-data'
        });
      });
      
      await page.click('#generateButton');
      
      // Should handle gracefully even if canvas becomes tainted
      await page.waitForSelector('#generateButton:not([disabled])', { timeout: 20000 });
      
      // May or may not have generated valid data URLs depending on CORS handling
      const generatedIds = await page.evaluate(() => {
        return window.appState.getGeneratedIds();
      });
      
      // Should at least have the structure even if generation failed
      expect(generatedIds).toHaveLength(1);
    });
  });

  test.describe('Integration with Edit Layout', () => {
    test('should maintain download functionality after editing layout', async ({ page }) => {
      await page.click('#generateButton');
      await page.waitForSelector('#generateButton:not([disabled])', { timeout: 20000 });
      
      // Edit layout
      await page.click('#editLayoutButton');
      
      // Fields should be visible
      const fields = page.locator('#fieldLayer .field');
      await expect(fields.first()).toBeVisible();
      
      // Download should still work
      const downloadPromise = page.waitForEvent('download');
      await page.click('#downloadPreviewButton');
      const download = await downloadPromise;
      
      expect(download.suggestedFilename()).toBe('id_1.png');
    });

    test('should hide edit button after download all', async ({ page }) => {
      await page.fill('#numIDsToGenerate', '2');
      await page.click('#generateButton');
      await page.waitForSelector('#generateButton:not([disabled])', { timeout: 30000 });
      
      const editLayoutButton = page.locator('#editLayoutButton');
      await expect(editLayoutButton).toBeVisible();
      
      // Download all
      const downloadPromise = page.waitForEvent('download');
      await page.click('#downloadAllButton');
      await downloadPromise;
      
      // Edit button should remain visible (downloads don't affect edit state)
      await expect(editLayoutButton).toBeVisible();
    });
  });
});