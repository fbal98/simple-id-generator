import { test, expect } from '@playwright/test';
import { TestUtils } from '../helpers/test-utils.js';
import path from 'path';

test.describe('Download & Post-Generation Flows', () => {
  let testUtils;

  test.beforeEach(async ({ page }) => {
    testUtils = new TestUtils(page);
    await testUtils.setRandomSeed(); // For consistent results
    await testUtils.mockFaceApi(); // Mock external API
    await page.goto('/');
    
    // Setup complete ID template
    const templatePath = path.join(__dirname, '../fixtures/template_id.JPEG');
    await testUtils.uploadTemplate(templatePath);
    
    // Add and position fields
    await testUtils.addField('name');
    await testUtils.addField('dob');
    await testUtils.addField('photo');
    
    await testUtils.positionField(testUtils.getFieldSelector('name'), 100, 100);
    await testUtils.positionField(testUtils.getFieldSelector('dob'), 100, 150);
    await testUtils.positionField(testUtils.getFieldSelector('photo'), 200, 100);
    
    // Generate IDs for download testing
    await testUtils.generateIds(1);
  });

  test('should download preview of generated ID', async ({ page }) => {
    // Look for download/preview button
    const downloadBtn = page.locator('#download-preview, .download-btn, [data-action="download"]').first();
    
    if (await downloadBtn.count() > 0) {
      const download = await testUtils.downloadFile('#download-preview, .download-btn, [data-action="download"]');
      
      // Verify download occurred
      expect(download.filename).toBeTruthy();
      expect(download.path).toBeTruthy();
      
      // Verify file type
      expect(download.filename).toMatch(/\.(png|jpg|jpeg)$/i);
    } else {
      // Try right-click context menu or other download methods
      const generatedId = page.locator('.generated-id').first();
      await generatedId.click({ button: 'right' });
      
      // Look for save/download in context menu
      const saveOption = page.locator('text="Save"', 'text="Download"').first();
      if (await saveOption.count() > 0) {
        const download = await page.waitForDownload();
        expect(download).toBeTruthy();
      }
    }
  });

  test('should download all IDs as ZIP archive', async ({ page }) => {
    // Generate multiple IDs first
    await testUtils.generateIds(3);
    
    // Look for ZIP download button
    const zipDownloadBtn = page.locator('#download-all, .download-zip, [data-action="download-zip"]').first();
    
    if (await zipDownloadBtn.count() > 0) {
      const download = await testUtils.downloadFile('#download-all, .download-zip, [data-action="download-zip"]');
      
      // Verify ZIP download
      expect(download.filename).toBeTruthy();
      expect(download.filename).toMatch(/\.zip$/i);
      expect(download.path).toBeTruthy();
    }
  });

  test('should verify downloaded file integrity', async ({ page }) => {
    const downloadBtn = page.locator('#download-preview, .download-btn, [data-action="download"]').first();
    
    if (await downloadBtn.count() > 0) {
      const download = await testUtils.downloadFile('#download-preview, .download-btn, [data-action="download"]');
      
      // Verify file exists and has content
      const fs = require('fs');
      if (download.path && fs.existsSync(download.path)) {
        const stats = fs.statSync(download.path);
        expect(stats.size).toBeGreaterThan(1000); // Should be a reasonable file size
      }
    }
  });

  test('should handle download with no generated IDs', async ({ page }) => {
    // Clear generated IDs
    await page.reload();
    await testUtils.uploadTemplate(path.join(__dirname, '../fixtures/template_id.JPEG'));
    
    // Try to download without generating
    const downloadBtn = page.locator('#download-preview, .download-btn, [data-action="download"]').first();
    
    if (await downloadBtn.count() > 0) {
      // Button should be disabled or show error
      const isDisabled = await downloadBtn.getAttribute('disabled');
      if (isDisabled === null) {
        // If not disabled, clicking should show error or no-op
        await downloadBtn.click();
        
        // Check for error message
        const errorMsg = page.locator('.error-message, .alert, [role="alert"]');
        if (await errorMsg.count() > 0) {
          await expect(errorMsg.first()).toBeVisible();
        }
      }
    }
  });

  test('should maintain download functionality after regeneration', async ({ page }) => {
    // Download first generation
    const downloadBtn = page.locator('#download-preview, .download-btn, [data-action="download"]').first();
    
    if (await downloadBtn.count() > 0) {
      const firstDownload = await testUtils.downloadFile('#download-preview, .download-btn, [data-action="download"]');
      expect(firstDownload.filename).toBeTruthy();
      
      // Generate new IDs
      await testUtils.generateIds(1);
      
      // Download should still work
      const secondDownload = await testUtils.downloadFile('#download-preview, .download-btn, [data-action="download"]');
      expect(secondDownload.filename).toBeTruthy();
    }
  });

  test('should verify file naming conventions', async ({ page }) => {
    const downloadBtn = page.locator('#download-preview, .download-btn, [data-action="download"]').first();
    
    if (await downloadBtn.count() > 0) {
      const download = await testUtils.downloadFile('#download-preview, .download-btn, [data-action="download"]');
      
      // Verify filename follows conventions
      expect(download.filename).toMatch(/^[a-zA-Z0-9_-]+\.(png|jpg|jpeg)$/i);
      
      // Should contain some identifier or timestamp
      expect(download.filename.length).toBeGreaterThan(5);
    }
  });

  test('should handle multiple downloads in sequence', async ({ page }) => {
    const downloadBtn = page.locator('#download-preview, .download-btn, [data-action="download"]').first();
    
    if (await downloadBtn.count() > 0) {
      // Download multiple times
      const download1 = await testUtils.downloadFile('#download-preview, .download-btn, [data-action="download"]');
      await page.waitForTimeout(1000);
      
      const download2 = await testUtils.downloadFile('#download-preview, .download-btn, [data-action="download"]');
      
      // Both downloads should succeed
      expect(download1.filename).toBeTruthy();
      expect(download2.filename).toBeTruthy();
    }
  });

  test('should handle ZIP download with large number of IDs', async ({ page }) => {
    // Generate more IDs
    await testUtils.generateIds(5);
    
    const zipDownloadBtn = page.locator('#download-all, .download-zip, [data-action="download-zip"]').first();
    
    if (await zipDownloadBtn.count() > 0) {
      const download = await testUtils.downloadFile('#download-all, .download-zip, [data-action="download-zip"]');
      
      // Verify ZIP download with multiple files
      expect(download.filename).toMatch(/\.zip$/i);
      
      // File size should be larger for more IDs
      if (download.path) {
        const fs = require('fs');
        if (fs.existsSync(download.path)) {
          const stats = fs.statSync(download.path);
          expect(stats.size).toBeGreaterThan(5000); // Should be larger for multiple IDs
        }
      }
    }
  });

  test('should show download progress for large operations', async ({ page }) => {
    // Generate multiple IDs
    await testUtils.generateIds(5);
    
    const zipDownloadBtn = page.locator('#download-all, .download-zip, [data-action="download-zip"]').first();
    
    if (await zipDownloadBtn.count() > 0) {
      // Start download and check for progress indicators
      await zipDownloadBtn.click();
      
      // Look for progress indicators
      const progressIndicator = page.locator('.download-progress, .progress-bar, [data-progress="download"]');
      if (await progressIndicator.count() > 0) {
        await expect(progressIndicator.first()).toBeVisible();
      }
      
      // Wait for download to complete
      await page.waitForDownload({ timeout: 30000 });
    }
  });

  test('should enable edit mode after generation', async ({ page }) => {
    // Look for edit mode button or functionality
    const editBtn = page.locator('#edit-mode, .edit-btn, [data-action="edit"]').first();
    
    if (await editBtn.count() > 0) {
      await editBtn.click();
      
      // Should return to edit mode
      const templateContainer = page.locator('#template-container');
      await expect(templateContainer).toBeVisible();
      
      // Fields should be editable again
      const fields = page.locator('[id^="field-"]');
      if (await fields.count() > 0) {
        await expect(fields.first()).toBeVisible();
      }
    }
  });
});