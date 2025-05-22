import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Complete User Workflows', () => {
  test.describe('End-to-End ID Generation Workflow', () => {
    test('should complete full ID creation workflow', async ({ page }) => {
      await page.goto('/');
      
      // Step 1: Upload template
      const fileInput = page.locator('#templateUpload');
      const testImagePath = path.join(__dirname, 'fixtures', 'realistic-id-template.svg');
      await fileInput.setInputFiles(testImagePath);
      await page.waitForTimeout(1000);
      
      // Verify template loaded
      const canvas = page.locator('#idCanvas');
      await expect(canvas).not.toHaveClass(/empty-canvas/);
      
      // Step 2: Add and position all field types
      const fieldTypes = [
        { button: '#addNameField', type: 'name', position: { x: 200, y: 100 } },
        { button: '#addDOBField', type: 'dob', position: { x: 200, y: 150 } },
        { button: '#addCivilNoField', type: 'civilNo', position: { x: 200, y: 200 } },
        { button: '#addIssueDateField', type: 'issueDate', position: { x: 200, y: 250 } },
        { button: '#addExpiryDateField', type: 'expiryDate', position: { x: 200, y: 300 } },
        { button: '#addPhotoField', type: 'photo', position: { x: 50, y: 120 } }
      ];
      
      for (const field of fieldTypes) {
        await page.click(field.button);
        
        const addedField = page.locator(`#fieldLayer .field[data-type="${field.type}"]:last-of-type`);
        await addedField.dragTo(canvas, { targetPosition: field.position });
      }
      
      // Verify all fields added
      const allFields = page.locator('#fieldLayer .field');
      await expect(allFields).toHaveCount(6);
      
      // Step 3: Customize font for text fields
      const nameField = page.locator('#fieldLayer .field[data-type="name"]');
      await nameField.click();
      
      await page.selectOption('#fontFamilySelect', 'Times New Roman');
      await page.fill('#fontSizeInput', '18');
      
      // Step 4: Generate multiple IDs
      await page.fill('#numIDsToGenerate', '5');
      await page.click('#generateButton');
      
      // Wait for generation to complete
      await page.waitForSelector('#generateButton:not([disabled])', { timeout: 60000 });
      
      // Verify generation completed successfully
      await expect(page.locator('#downloadPreviewButton')).toBeEnabled();
      await expect(page.locator('#editLayoutButton')).toBeVisible();
      await expect(page.locator('#downloadAllButton')).toBeVisible();
      
      // Step 5: Test preview download
      const previewDownloadPromise = page.waitForEvent('download');
      await page.click('#downloadPreviewButton');
      const previewDownload = await previewDownloadPromise;
      
      expect(previewDownload.suggestedFilename()).toBe('id_1.png');
      
      // Step 6: Test edit layout functionality
      await page.click('#editLayoutButton');
      
      // Fields should be visible again
      await expect(allFields.first()).toBeVisible();
      
      // Make a layout change
      await nameField.dragTo(canvas, { targetPosition: { x: 250, y: 110 } });
      
      // Step 7: Test download all functionality
      const zipDownloadPromise = page.waitForEvent('download');
      await page.click('#downloadAllButton');
      const zipDownload = await zipDownloadPromise;
      
      expect(zipDownload.suggestedFilename()).toBe('generated_ids.zip');
      
      // Verify app state
      const generatedIds = await page.evaluate(() => {
        return window.appState.getGeneratedIds();
      });
      
      expect(generatedIds).toHaveLength(5);
      
      // Each ID should have data for all field types
      generatedIds.forEach(id => {
        expect(Object.keys(id.instanceData.text)).toHaveLength(5); // 5 text fields
        expect(Object.keys(id.instanceData.photos)).toHaveLength(1); // 1 photo field
        expect(id.dataUrl).toMatch(/^data:image\/png;base64,/);
      });
    });

    test('should handle workflow with only text fields', async ({ page }) => {
      await page.goto('/');
      
      // Upload template
      const fileInput = page.locator('#templateUpload');
      const testImagePath = path.join(__dirname, 'fixtures', 'realistic-id-template.svg');
      await fileInput.setInputFiles(testImagePath);
      await page.waitForTimeout(1000);
      
      // Add only text fields
      await page.click('#addNameField');
      await page.click('#addDOBField');
      await page.click('#addCivilNoField');
      
      // Position fields
      const fields = page.locator('#fieldLayer .field');
      await fields.nth(0).dragTo(page.locator('#idCanvas'), { targetPosition: { x: 200, y: 100 } });
      await fields.nth(1).dragTo(page.locator('#idCanvas'), { targetPosition: { x: 200, y: 150 } });
      await fields.nth(2).dragTo(page.locator('#idCanvas'), { targetPosition: { x: 200, y: 200 } });
      
      // Generate IDs
      await page.fill('#numIDsToGenerate', '3');
      await page.click('#generateButton');
      
      // Should complete faster without photo fetching
      await page.waitForSelector('#generateButton:not([disabled])', { timeout: 20000 });
      
      await expect(page.locator('#downloadPreviewButton')).toBeEnabled();
      await expect(page.locator('#downloadAllButton')).toBeVisible();
      
      // Test downloads
      const previewDownloadPromise = page.waitForEvent('download');
      await page.click('#downloadPreviewButton');
      await previewDownloadPromise;
      
      const zipDownloadPromise = page.waitForEvent('download');
      await page.click('#downloadAllButton');
      await zipDownloadPromise;
    });

    test('should handle workflow with only photo fields', async ({ page }) => {
      await page.goto('/');
      
      // Upload template
      const fileInput = page.locator('#templateUpload');
      const testImagePath = path.join(__dirname, 'fixtures', 'realistic-id-template.svg');
      await fileInput.setInputFiles(testImagePath);
      await page.waitForTimeout(1000);
      
      // Add multiple photo fields
      await page.click('#addPhotoField');
      await page.click('#addPhotoField');
      
      // Position fields
      const fields = page.locator('#fieldLayer .field');
      await fields.nth(0).dragTo(page.locator('#idCanvas'), { targetPosition: { x: 50, y: 100 } });
      await fields.nth(1).dragTo(page.locator('#idCanvas'), { targetPosition: { x: 200, y: 100 } });
      
      // Generate single ID
      await page.click('#generateButton');
      
      // Should complete with photo fetching
      await page.waitForSelector('#generateButton:not([disabled])', { timeout: 30000 });
      
      await expect(page.locator('#downloadPreviewButton')).toBeEnabled();
      
      // Download all should be hidden for single ID
      await expect(page.locator('#downloadAllButton')).toBeHidden();
      
      // Test preview download
      const downloadPromise = page.waitForEvent('download');
      await page.click('#downloadPreviewButton');
      await downloadPromise;
    });
  });

  test.describe('Workflow Error Recovery', () => {
    test('should recover from generation failures', async ({ page }) => {
      await page.goto('/');
      
      // Upload template and add fields
      const fileInput = page.locator('#templateUpload');
      const testImagePath = path.join(__dirname, 'fixtures', 'realistic-id-template.svg');
      await fileInput.setInputFiles(testImagePath);
      await page.waitForTimeout(1000);
      
      await page.click('#addNameField');
      await page.click('#addPhotoField');
      
      // Mock API failure
      await page.route('**/api/face', route => {
        route.fulfill({
          status: 500,
          body: 'Server Error'
        });
      });
      
      // Attempt generation
      await page.click('#generateButton');
      await page.waitForSelector('#generateButton:not([disabled])', { timeout: 20000 });
      
      // Should still enable downloads (graceful degradation)
      await expect(page.locator('#downloadPreviewButton')).toBeEnabled();
      
      // Fix API and try again
      await page.unroute('**/api/face');
      
      await page.click('#generateButton');
      await page.waitForSelector('#generateButton:not([disabled])', { timeout: 30000 });
      
      // Should work normally now
      await expect(page.locator('#downloadPreviewButton')).toBeEnabled();
    });

    test('should handle template change mid-workflow', async ({ page }) => {
      await page.goto('/');
      
      // Start with first template
      const fileInput = page.locator('#templateUpload');
      const testImagePath = path.join(__dirname, 'fixtures', 'realistic-id-template.svg');
      await fileInput.setInputFiles(testImagePath);
      await page.waitForTimeout(1000);
      
      // Add fields and generate
      await page.click('#addNameField');
      await page.click('#addDOBField');
      
      await page.click('#generateButton');
      await page.waitForSelector('#generateButton:not([disabled])', { timeout: 20000 });
      
      // Change template mid-workflow
      const smallImagePath = path.join(__dirname, 'fixtures', 'small-test-template.svg');
      await fileInput.setInputFiles(smallImagePath);
      await page.waitForTimeout(1000);
      
      // Should reset state
      const fields = page.locator('#fieldLayer .field');
      await expect(fields).toHaveCount(0);
      await expect(page.locator('#downloadPreviewButton')).toBeDisabled();
      await expect(page.locator('#downloadAllButton')).toBeHidden();
      
      // Should be able to start fresh workflow
      await page.click('#addNameField');
      await page.click('#generateButton');
      await page.waitForSelector('#generateButton:not([disabled])', { timeout: 20000 });
      
      await expect(page.locator('#downloadPreviewButton')).toBeEnabled();
    });

    test('should handle browser refresh during workflow', async ({ page }) => {
      await page.goto('/');
      
      // Upload template and add fields
      const fileInput = page.locator('#templateUpload');
      const testImagePath = path.join(__dirname, 'fixtures', 'realistic-id-template.svg');
      await fileInput.setInputFiles(testImagePath);
      await page.waitForTimeout(1000);
      
      await page.click('#addNameField');
      await page.click('#addDOBField');
      
      // Refresh page
      await page.reload();
      
      // Should return to initial state
      const canvas = page.locator('#idCanvas');
      await expect(canvas).toHaveClass(/empty-canvas/);
      
      const fields = page.locator('#fieldLayer .field');
      await expect(fields).toHaveCount(0);
      
      await expect(page.locator('#downloadPreviewButton')).toBeDisabled();
      await expect(page.locator('#downloadAllButton')).toBeHidden();
      
      // Should be able to start new workflow
      await fileInput.setInputFiles(testImagePath);
      await page.waitForTimeout(1000);
      
      await page.click('#addNameField');
      await page.click('#generateButton');
      await page.waitForSelector('#generateButton:not([disabled])', { timeout: 20000 });
      
      await expect(page.locator('#downloadPreviewButton')).toBeEnabled();
    });
  });

  test.describe('Performance and Stress Testing', () => {
    test('should handle rapid user interactions', async ({ page }) => {
      await page.goto('/');
      
      const fileInput = page.locator('#templateUpload');
      const testImagePath = path.join(__dirname, 'fixtures', 'realistic-id-template.svg');
      await fileInput.setInputFiles(testImagePath);
      await page.waitForTimeout(1000);
      
      // Rapidly add and remove fields
      for (let i = 0; i < 5; i++) {
        await page.click('#addNameField');
        await page.click('#addDOBField');
        
        // Upload new template to clear fields
        await fileInput.setInputFiles(testImagePath);
        await page.waitForTimeout(100);
      }
      
      // Should remain stable
      await expect(page.locator('#idCanvas')).toBeVisible();
      await expect(page.locator('#templateUpload')).toBeVisible();
    });

    test('should handle large batch generation workflow', async ({ page }) => {
      test.slow(); // Mark as slow test
      
      await page.goto('/');
      
      const fileInput = page.locator('#templateUpload');
      const testImagePath = path.join(__dirname, 'fixtures', 'realistic-id-template.svg');
      await fileInput.setInputFiles(testImagePath);
      await page.waitForTimeout(1000);
      
      // Add minimal fields for faster generation
      await page.click('#addNameField');
      await page.click('#addDOBField');
      
      // Generate large batch
      await page.fill('#numIDsToGenerate', '20');
      await page.click('#generateButton');
      
      // Wait for completion with extended timeout
      await page.waitForSelector('#generateButton:not([disabled])', { timeout: 120000 });
      
      // Verify successful completion
      await expect(page.locator('#downloadPreviewButton')).toBeEnabled();
      await expect(page.locator('#downloadAllButton')).toBeVisible();
      
      // Test download functionality with large batch
      const zipDownloadPromise = page.waitForEvent('download');
      await page.click('#downloadAllButton');
      const zipDownload = await zipDownloadPromise;
      
      expect(zipDownload.suggestedFilename()).toBe('generated_ids.zip');
    });

    test('should handle memory-intensive operations', async ({ page }) => {
      await page.goto('/');
      
      const fileInput = page.locator('#templateUpload');
      const testImagePath = path.join(__dirname, 'fixtures', 'realistic-id-template.svg');
      await fileInput.setInputFiles(testImagePath);
      await page.waitForTimeout(1000);
      
      // Add all field types including photos
      await page.click('#addNameField');
      await page.click('#addDOBField');
      await page.click('#addCivilNoField');
      await page.click('#addIssueDateField');
      await page.click('#addExpiryDateField');
      await page.click('#addPhotoField');
      
      // Generate moderate batch with all features
      await page.fill('#numIDsToGenerate', '10');
      await page.click('#generateButton');
      
      await page.waitForSelector('#generateButton:not([disabled])', { timeout: 90000 });
      
      // Verify all operations still work
      await expect(page.locator('#downloadPreviewButton')).toBeEnabled();
      await expect(page.locator('#downloadAllButton')).toBeVisible();
      
      // Test edit layout with memory-intensive state
      await page.click('#editLayoutButton');
      
      const fields = page.locator('#fieldLayer .field');
      await expect(fields.first()).toBeVisible();
      
      // Test downloads still work
      const downloadPromise = page.waitForEvent('download');
      await page.click('#downloadPreviewButton');
      await downloadPromise;
    });
  });

  test.describe('Cross-Browser Workflow Compatibility', () => {
    ['chromium', 'firefox', 'webkit'].forEach(browserName => {
      test(`should complete workflow in ${browserName}`, async ({ page, browserName: currentBrowser }) => {
        test.skip(currentBrowser !== browserName, `Skipping ${browserName} test in ${currentBrowser}`);
        
        await page.goto('/');
        
        // Basic workflow test for each browser
        const fileInput = page.locator('#templateUpload');
        const testImagePath = path.join(__dirname, 'fixtures', 'realistic-id-template.svg');
        await fileInput.setInputFiles(testImagePath);
        await page.waitForTimeout(1000);
        
        await page.click('#addNameField');
        await page.click('#addDOBField');
        
        await page.fill('#numIDsToGenerate', '2');
        await page.click('#generateButton');
        
        await page.waitForSelector('#generateButton:not([disabled])', { timeout: 30000 });
        
        await expect(page.locator('#downloadPreviewButton')).toBeEnabled();
        await expect(page.locator('#downloadAllButton')).toBeVisible();
        
        // Test downloads work in this browser
        const downloadPromise = page.waitForEvent('download');
        await page.click('#downloadPreviewButton');
        await downloadPromise;
      });
    });
  });
});